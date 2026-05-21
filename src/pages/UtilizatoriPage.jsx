import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../lib/users';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function UtilizatoriPage() {
  const { currentUser, getUserPinInfo, resetPin } = useAuth();
  const [pinInfos, setPinInfos] = useState({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    const load = async () => {
      const infos = {};
      for (const user of USERS) {
        try {
          infos[user.id] = await getUserPinInfo(user.id);
        } catch {
          infos[user.id] = { hasPin: false };
        }
      }
      setPinInfos(infos);
      setLoading(false);
    };
    load();
  }, []);

  const handleReset = async (userId, userName) => {
    if (!confirm(`Resetezi PIN-ul pentru ${userName}? La următoarea conectare va trebui să seteze un PIN nou.`)) return;
    setResetting(userId);
    try {
      await resetPin(userId);
      setPinInfos(prev => ({
        ...prev,
        [userId]: { ...prev[userId], hasPin: false, pinResetRequired: true }
      }));
      toast.success(`PIN resetat pentru ${userName}`);
    } catch {
      toast.error('Eroare la resetare PIN');
    } finally {
      setResetting(null);
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-surface-500">Acces restricționat — doar administrator</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-surface-900 font-bold">Utilizatori & PIN</h1>
        <p className="text-surface-500 text-sm mt-0.5">Gestionează utilizatorii și resetează PIN-urile</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
        <div className="text-sm text-amber-800">
          <strong>Securitate PIN:</strong> PIN-urile sunt stocate criptat în Firebase. Ca admin poți reseta un PIN, dar nu poți vedea PIN-ul existent. La resetare, utilizatoarea va seta un PIN nou la prima conectare.
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {USERS.map(user => {
            const info = pinInfos[user.id] || {};
            const isCurrentUser = user.id === currentUser?.id;
            return (
              <div key={user.id} className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4 shadow-glass">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: user.bgColor, color: user.color }}
                >
                  {user.avatar}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-surface-900">{user.displayName}</span>
                    {isCurrentUser && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Tu</span>
                    )}
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">
                      {user.role === 'admin' ? 'Administrator' :
                       user.role === 'tania' ? 'Șefă' :
                       `Operator · ${user.location}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    {info.hasPin ? (
                      <>
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          PIN setat
                        </span>
                        {info.pinSetAt && (
                          <span>Setat: {format(new Date(info.pinSetAt), 'dd MMM yyyy', { locale: ro })}</span>
                        )}
                        {info.lastLogin && (
                          <span>Ultima conectare: {format(new Date(info.lastLogin), 'dd MMM yyyy HH:mm', { locale: ro })}</span>
                        )}
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        {info.pinResetRequired ? 'PIN resetat — va seta la conectare' : 'PIN nesetat încă'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reset button */}
                {!isCurrentUser && info.hasPin && (
                  <button
                    onClick={() => handleReset(user.id, user.displayName)}
                    disabled={resetting === user.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {resetting === user.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                    Resetează PIN
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
