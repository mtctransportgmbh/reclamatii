import { useState, useEffect } from 'react';
import { getStatistici } from '../lib/dataService';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#0891b2', '#d97706', '#059669', '#db2777', '#7c3aed'];

export default function StatisticiPage() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatistici().then(s => { setStats(s); setLoading(false); });
  }, []);

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'tania') {
    return <div className="p-6 text-center"><p className="text-surface-500">Acces restricționat</p></div>;
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-surface-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-surface-200 h-48 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const lunaData = Object.entries(stats?.perLuna || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, val]) => ({ luna: key, total: val.total, rezolvate: val.rezolvate, nerezolvate: val.total - val.rezolvate }));

  const topSoferiData = (stats?.topSoferi || []).slice(0, 10).map(s => ({
    name: `T.${s.tura}`,
    reclamatii: s.total,
    medie: s.medie ? parseFloat(s.medie) : 0,
  }));

  const statusPie = [
    { name: 'Rezolvate', value: (stats?.reclamatii || []).filter(r => r.status === 'rezolvata').length },
    { name: 'Nerezolvate', value: (stats?.reclamatii || []).filter(r => r.status !== 'rezolvata').length },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-surface-900 font-bold">Statistici</h1>
        <p className="text-surface-500 text-sm mt-0.5">Analiză completă · {stats?.total || 0} reclamații total</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total reclamații', value: stats?.total || 0, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Șoferi activi', value: stats?.topSoferi?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Adrese problematice', value: stats?.topAdrese?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Persoane recurente', value: stats?.topPersoane?.filter(p => p.total > 1).length || 0, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
            <div className={`text-3xl font-display font-bold ${c.color} mb-1`}>{c.value}</div>
            <div className="text-xs text-surface-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Line chart per luna */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
          <h2 className="font-display text-sm font-semibold text-surface-900 mb-4">Reclamații pe luni (ultimele 12)</h2>
          {lunaData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-surface-300 text-sm">Date insuficiente</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lunaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
                <XAxis dataKey="luna" tick={{ fontSize: 11, fill: '#9aa3c2' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa3c2' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e8f4' }} />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Total" />
                <Line type="monotone" dataKey="rezolvate" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Rezolvate" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart status */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
          <h2 className="font-display text-sm font-semibold text-surface-900 mb-4">Status reclamații</h2>
          {statusPie[0].value === 0 && statusPie[1].value === 0 ? (
            <div className="h-40 flex items-center justify-center text-surface-300 text-sm">Fără date</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {statusPie.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : '#e24b4a'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Rezolvate ({statusPie[0].value})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Nerezolvate ({statusPie[1].value})</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar chart soferi */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass mb-6">
        <h2 className="font-display text-sm font-semibold text-surface-900 mb-4">Top șoferi — reclamații totale</h2>
        {topSoferiData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-surface-300 text-sm">Date insuficiente</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topSoferiData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9aa3c2' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9aa3c2' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e8f4' }} />
              <Bar dataKey="reclamatii" fill="#6366f1" radius={[4, 4, 0, 0]} name="Reclamații" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Top adrese */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
          <h2 className="font-display text-sm font-semibold text-surface-900 mb-3">Top adrese problematice</h2>
          {(stats?.topAdrese || []).length === 0 ? (
            <p className="text-surface-400 text-sm">Fără date</p>
          ) : (
            <div className="space-y-2">
              {stats.topAdrese.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-surface-100 text-surface-600 text-xs flex items-center justify-center font-medium flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-xs text-surface-700 truncate">{a.adresa}</span>
                  <span className="text-xs font-semibold text-red-600 flex-shrink-0">{a.total}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top persoane */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
          <h2 className="font-display text-sm font-semibold text-surface-900 mb-3">Top persoane reclamante</h2>
          {(stats?.topPersoane || []).length === 0 ? (
            <p className="text-surface-400 text-sm">Fără date</p>
          ) : (
            <div className="space-y-2">
              {stats.topPersoane.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-surface-100 text-surface-600 text-xs flex items-center justify-center font-medium flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-xs text-surface-700 truncate">{p.nume}</span>
                  <span className="text-xs font-semibold text-amber-600 flex-shrink-0">{p.total}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top soferi cu medie */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 shadow-glass">
        <h2 className="font-display text-sm font-semibold text-surface-900 mb-3">Clasament șoferi — medie reclamații/pachete</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-surface-500 border-b border-surface-100">
                <th className="text-left py-2 pr-4 font-medium">#</th>
                <th className="text-left py-2 pr-4 font-medium">Tura</th>
                <th className="text-left py-2 pr-4 font-medium">Nume</th>
                <th className="text-left py-2 pr-4 font-medium">Locație</th>
                <th className="text-right py-2 pr-4 font-medium">Reclamații</th>
                <th className="text-right py-2 pr-4 font-medium">Pachete livrate</th>
                <th className="text-right py-2 font-medium">Medie %</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.topSoferi || []).map((s, i) => (
                <tr key={s.id} className="border-b border-surface-50 hover:bg-surface-50">
                  <td className="py-2.5 pr-4 text-surface-400">{i + 1}</td>
                  <td className="py-2.5 pr-4 font-mono font-medium text-surface-900">{s.tura}</td>
                  <td className="py-2.5 pr-4 text-surface-700">{s.numeSofer}</td>
                  <td className="py-2.5 pr-4 text-surface-500">{s.locatie}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-red-600">{s.total}</td>
                  <td className="py-2.5 pr-4 text-right text-surface-600">{s.totalPachete?.toLocaleString() || '—'}</td>
                  <td className="py-2.5 text-right">
                    {s.medie != null ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        parseFloat(s.medie) > 2 ? 'bg-red-100 text-red-700' :
                        parseFloat(s.medie) > 1 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {s.medie}%
                      </span>
                    ) : <span className="text-surface-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
