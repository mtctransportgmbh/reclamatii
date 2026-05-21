import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USERS } from '../lib/users';
import toast from 'react-hot-toast';

const PIN_LENGTH = 4;

export default function LoginPage() {
  const [step, setStep] = useState('select'); // 'select' | 'pin' | 'setup' | 'confirm'
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, setupPin, checkPinStatus } = useAuth();
  const navigate = useNavigate();

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const status = await checkPinStatus(user.id);
      if (status === 'not_set') {
        setStep('setup');
      } else {
        setStep('pin');
      }
    } catch {
      toast.error('Eroare conexiune');
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handlePinKey = async (digit) => {
    const currentPin = isConfirming ? confirmPin : pin;
    const setCurrentPin = isConfirming ? setConfirmPin : setPin;

    if (digit === 'del') {
      setCurrentPin(prev => prev.slice(0, -1));
      return;
    }

    const newPin = currentPin + digit;
    setCurrentPin(newPin);

    if (newPin.length < PIN_LENGTH) return;

    // PIN complete
    if (step === 'pin') {
      // Login
      setLoading(true);
      try {
        await login(selectedUser.id, newPin);
        navigate('/');
      } catch {
        triggerShake();
        setPin('');
        toast.error('PIN incorect. Încearcă din nou.');
      } finally {
        setLoading(false);
      }
    } else if (step === 'setup') {
      if (!isConfirming) {
        // First entry - ask confirm
        setIsConfirming(true);
      } else {
        // Confirm PIN
        if (pin === newPin) {
          setLoading(true);
          try {
            await setupPin(selectedUser.id, newPin);
            await login(selectedUser.id, newPin);
            navigate('/');
            toast.success(`Bun venit, ${selectedUser.displayName}! PIN setat cu succes.`);
          } catch {
            toast.error('Eroare la setarea PIN-ului');
            setPin('');
            setConfirmPin('');
            setIsConfirming(false);
          } finally {
            setLoading(false);
          }
        } else {
          triggerShake();
          setConfirmPin('');
          setIsConfirming(false);
          setPin('');
          toast.error('PIN-urile nu coincid. Încearcă din nou.');
        }
      }
    }
  };

  const displayPin = isConfirming ? confirmPin : pin;

  const keypadButtons = [
    '1','2','3',
    '4','5','6',
    '7','8','9',
    '','0','del'
  ];

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: `radial-gradient(circle at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(14,165,233,0.06) 0%, transparent 50%)`,
      }}
    >
      {/* Logo */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <span className="font-display text-2xl text-surface-900 tracking-tight">Reclamații</span>
        </div>
        <p className="text-surface-500 text-sm">Gestiune reclamații livrări</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm animate-slide-up">

        {/* STEP: Select user */}
        {step === 'select' && (
          <div className="bg-white rounded-2xl shadow-glass p-6 border border-surface-200">
            <h2 className="font-display text-lg text-surface-900 mb-5 text-center">Cine ești?</h2>
            <div className="space-y-2">
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50 transition-all duration-150 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: user.bgColor, color: user.color }}
                  >
                    {user.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-surface-900 text-sm">{user.displayName}</div>
                    <div className="text-xs text-surface-400">
                      {user.role === 'admin' ? 'Administrator' :
                       user.role === 'tania' ? 'Șefă · toate locațiile' :
                       `Operator · ${user.location}`}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-surface-300 group-hover:text-brand-400 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: PIN entry or setup */}
        {(step === 'pin' || step === 'setup') && selectedUser && (
          <div className="bg-white rounded-2xl shadow-glass p-6 border border-surface-200">
            {/* Back button */}
            <button
              onClick={() => { setStep('select'); setSelectedUser(null); setPin(''); setConfirmPin(''); setIsConfirming(false); }}
              className="flex items-center gap-1.5 text-surface-400 hover:text-surface-700 text-sm mb-5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Înapoi
            </button>

            {/* User info */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-3 shadow-sm"
                style={{ backgroundColor: selectedUser.bgColor, color: selectedUser.color }}
              >
                {selectedUser.avatar}
              </div>
              <div className="font-display text-lg text-surface-900">{selectedUser.displayName}</div>
              <div className="text-xs text-surface-400 mt-0.5">
                {step === 'setup' && !isConfirming && 'Setează un PIN de 4 cifre'}
                {step === 'setup' && isConfirming && 'Confirmă PIN-ul'}
                {step === 'pin' && 'Introdu PIN-ul tău'}
              </div>
            </div>

            {/* PIN dots */}
            <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    i < displayPin.length
                      ? 'border-brand-600 bg-brand-600 scale-110'
                      : 'border-surface-300 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {keypadButtons.map((btn, i) => (
                <button
                  key={i}
                  onClick={() => btn !== '' && handlePinKey(btn)}
                  disabled={loading || btn === ''}
                  className={`
                    h-14 rounded-xl font-semibold text-lg transition-all duration-100 select-none
                    ${btn === '' ? 'cursor-default' : ''}
                    ${btn === 'del'
                      ? 'bg-surface-100 text-surface-500 hover:bg-surface-200 active:scale-95'
                      : btn !== ''
                        ? 'bg-surface-50 text-surface-900 hover:bg-brand-50 hover:text-brand-700 border border-surface-200 hover:border-brand-200 active:scale-95 shadow-sm'
                        : ''
                    }
                  `}
                >
                  {btn === 'del' ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
                      </svg>
                    </span>
                  ) : btn}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex justify-center mt-4">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-surface-400 animate-fade-in">
        © {new Date().getFullYear()} Reclamații App · Uz intern
      </p>
    </div>
  );
}
