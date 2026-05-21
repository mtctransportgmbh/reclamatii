import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { USERS } from '../lib/users';

const AuthContext = createContext(null);

// Simple PIN hash - XOR with salt + base64 (nu e cryptographic, e suficient pt uz intern)
function hashPin(pin, userId) {
  const salt = userId + 'reclamatii2024';
  let result = '';
  for (let i = 0; i < pin.length; i++) {
    result += String.fromCharCode(pin.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  return btoa(result);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinStatus, setPinStatus] = useState(null); // 'not_set' | 'set'

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem('reclamatii_session');
    if (saved) {
      try {
        const { userId, timestamp } = JSON.parse(saved);
        // Session valid 12 hours
        if (Date.now() - timestamp < 12 * 60 * 60 * 1000) {
          const user = USERS.find(u => u.id === userId);
          if (user) setCurrentUser(user);
        } else {
          localStorage.removeItem('reclamatii_session');
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const checkPinStatus = useCallback(async (userId) => {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().pinHash) {
      return 'set';
    }
    return 'not_set';
  }, []);

  const setupPin = useCallback(async (userId, pin) => {
    const pinHash = hashPin(pin, userId);
    await setDoc(doc(db, 'users', userId), {
      pinHash,
      pinSetAt: new Date().toISOString(),
      pinResetRequired: false,
    }, { merge: true });
  }, []);

  const login = useCallback(async (userId, pin) => {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    
    if (!snap.exists() || !snap.data().pinHash) {
      throw new Error('PIN nesetat');
    }

    const data = snap.data();
    const expected = hashPin(pin, userId);
    
    if (data.pinHash !== expected) {
      throw new Error('PIN incorect');
    }

    const user = USERS.find(u => u.id === userId);
    if (!user) throw new Error('Utilizator negăsit');

    // Log login
    await updateDoc(ref, {
      lastLogin: new Date().toISOString(),
    });

    setCurrentUser(user);
    localStorage.setItem('reclamatii_session', JSON.stringify({
      userId,
      timestamp: Date.now(),
    }));

    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('reclamatii_session');
  }, []);

  const resetPin = useCallback(async (userId) => {
    // Admin resets - marks pin as needing reset
    await setDoc(doc(db, 'users', userId), {
      pinHash: null,
      pinResetRequired: true,
      pinResetAt: new Date().toISOString(),
    }, { merge: true });
  }, []);

  const getUserPinInfo = useCallback(async (userId) => {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return { hasPin: false };
    const data = snap.data();
    return {
      hasPin: !!data.pinHash,
      pinSetAt: data.pinSetAt,
      lastLogin: data.lastLogin,
      pinResetRequired: data.pinResetRequired,
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      setupPin,
      checkPinStatus,
      resetPin,
      getUserPinInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
