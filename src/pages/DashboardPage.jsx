import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeReclamatii } from '../lib/dataService';
import { canUserSeeLocation } from '../lib/users';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-display font-bold text-surface-900 mb-0.5">{value}</div>
    <div className="text-sm font-medium text-surface-500">{label}</div>
    {sub && <div className="text-xs text-surface-400 mt-0.5">{sub}</div>}
  </div>
);

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [reclamatii, setReclamatii] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const location = (currentUser?.role === 'admin' || currentUser?.role === 'tania') ? null : currentUser?.location;
    const unsub = subscribeReclamatii(location, (data) => {
      setReclamatii(data);
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  const today = reclamatii.filter(r => {
    if (!r.createdAt) return false;
    const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const nerezolvate = reclamatii.filter(r => r.status === 'nerezolvata');
  const rezolvate = reclamatii.filter(r => r.status === 'rezolvata');
  const luna = new Date().getMonth();
  const anCurent = new Date().getFullYear();
  const lunaCurenta = reclamatii.filter(r => {
    if (!r.createdAt) return false;
    const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    return d.getMonth() === luna && d.getFullYear() === anCurent;
  });

  const recent = reclamatii.slice(0, 5);

  const statusColor = (s) => s === 'rezolvata'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-600 border-red-200';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-surface-900 font-bold">
          Bună ziua, {currentUser?.displayName} 👋
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy", { locale: ro })}
          {currentUser?.location && ` · ${currentUser.location}`}
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 h-28 animate-pulse">
              <div className="w-10 h-10 bg-surface-100 rounded-xl mb-3" />
              <div className="h-7 w-16 bg-surface-100 rounded mb-1" />
              <div className="h-3 w-24 bg-surface-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Azi" value={today.length}
            sub="reclamații adăugate"
            color="bg-brand-100"
            icon={<svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Luna aceasta" value={lunaCurenta.length}
            sub={format(new Date(), "MMMM yyyy", { locale: ro })}
            color="bg-blue-100"
            icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" /></svg>}
          />
          <StatCard
            label="Nerezolvate" value={nerezolvate.length}
            sub={`din ${reclamatii.length} total`}
            color="bg-red-100"
            icon={<svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>}
          />
          <StatCard
            label="Rezolvate" value={rezolvate.length}
            sub={reclamatii.length > 0 ? `${Math.round(rezolvate.length/reclamatii.length*100)}% rată` : '—'}
            color="bg-green-100"
            icon={<svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </div>
      )}

      {/* Quick action */}
      {(currentUser?.role === 'operator') && (
        <div className="mb-8">
          <Link
            to="/reclamatii"
            className="flex items-center gap-3 p-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-colors shadow-lg shadow-brand-200 group"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">Adaugă reclamație nouă</div>
              <div className="text-xs text-white/70">Locație: {currentUser.location}</div>
            </div>
            <svg className="w-5 h-5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-surface-900">Reclamații recente</h2>
          <Link to="/reclamatii" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Vezi toate →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center">
            <div className="text-surface-300 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-surface-500 text-sm">Nicio reclamație înregistrată</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(r => {
              const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
              return (
                <div key={r.id} className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 hover:border-surface-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-surface-900 truncate">{r.numeClient}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(r.status)}`}>
                        {r.status === 'rezolvata' ? '✓ Rezolvată' : '✗ Nerezolvată'}
                      </span>
                    </div>
                    <div className="text-xs text-surface-400">
                      {r.numePachet} · Tura {r.turaSofer} · {r.locatie}
                    </div>
                  </div>
                  <div className="text-xs text-surface-400 flex-shrink-0">
                    {format(d, 'dd MMM', { locale: ro })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
