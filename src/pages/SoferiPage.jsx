import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSoferi, addSofer, updateSofer, deleteSofer, setPachetelivrate, getAllPachetelivrate } from '../lib/dataService';
import toast from 'react-hot-toast';

const MONTHS = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SoferiPage() {
  const { currentUser } = useAuth();
  const [soferi, setSoferi] = useState([]);
  const [pachete, setPachete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tura: '', numeSofer: '', locatie: 'Ruhstorf' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pacheteEdit, setPacheteEdit] = useState({ tura: '', luna: new Date().getMonth() + 1, an: new Date().getFullYear(), pachete: '' });
  const [showPachete, setShowPachete] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [s, p] = await Promise.all([getSoferi(), getAllPachetelivrate()]);
    setSoferi(s);
    setPachete(p);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.tura || !form.numeSofer) return toast.error('Completează tura și numele');
    setSaving(true);
    try {
      if (editingId) {
        await updateSofer(editingId, form);
        toast.success('Șofer actualizat');
      } else {
        await addSofer(form);
        toast.success('Șofer adăugat');
      }
      setForm({ tura: '', numeSofer: '', locatie: 'Ruhstorf' });
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, tura) => {
    if (!confirm(`Ștergi tura ${tura}?`)) return;
    await deleteSofer(id);
    toast.success('Șofer șters');
    load();
  };

  const handleSavePachete = async () => {
    if (!pacheteEdit.tura || !pacheteEdit.pachete) return toast.error('Completează toate câmpurile');
    try {
      await setPachetelivrate(pacheteEdit.tura, pacheteEdit.luna, pacheteEdit.an, parseInt(pacheteEdit.pachete));
      toast.success('Pachete salvate');
      load();
      setShowPachete(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const getPacheteForTura = (tura) => {
    return pachete
      .filter(p => p.turaSofer === tura)
      .sort((a, b) => b.an - a.an || b.luna - a.luna);
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-6 text-center"><p className="text-surface-500">Acces restricționat</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-surface-900 font-bold">Șoferi & Ture</h1>
          <p className="text-surface-500 text-sm mt-0.5">{soferi.length} șoferi configurați</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPachete(!showPachete)}
            className="flex items-center gap-2 px-4 py-2.5 border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.75 7.5h16.5M5.625 7.5a2.25 2.25 0 01-2.25-2.25V5.25C3.375 4.007 4.382 3 5.625 3h12.75C19.618 3 20.625 4.007 20.625 5.25v.75a2.25 2.25 0 01-2.25 2.25" />
            </svg>
            Pachete livrate
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ tura: '', numeSofer: '', locatie: 'Ruhstorf' }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Adaugă șofer
          </button>
        </div>
      </div>

      {/* Add sofer form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-5 shadow-glass animate-slide-up">
          <h2 className="font-semibold text-surface-900 mb-4">{editingId ? 'Editează șofer' : 'Șofer nou'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Număr tură *</label>
              <input value={form.tura} onChange={e => setForm(f => ({...f, tura: e.target.value}))}
                placeholder="ex: 42" className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Nume șofer *</label>
              <input value={form.numeSofer} onChange={e => setForm(f => ({...f, numeSofer: e.target.value}))}
                placeholder="Nume complet" className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Locație</label>
              <select value={form.locatie} onChange={e => setForm(f => ({...f, locatie: e.target.value}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none">
                <option>Ruhstorf</option>
                <option>Eiselfing</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {editingId ? 'Salvează' : 'Adaugă'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-surface-600 hover:bg-surface-100 rounded-xl text-sm">
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Pachete livrate form */}
      {showPachete && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-5 shadow-glass animate-slide-up">
          <h2 className="font-semibold text-surface-900 mb-1">Introduci pachete livrate</h2>
          <p className="text-xs text-surface-500 mb-4">Necesare pentru calculul mediei reclamații/pachete</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Tura șofer</label>
              <select value={pacheteEdit.tura} onChange={e => setPacheteEdit(p => ({...p, tura: e.target.value}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none">
                <option value="">Selectează...</option>
                {soferi.map(s => <option key={s.id} value={s.tura}>Tura {s.tura} — {s.numeSofer}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Luna</label>
              <select value={pacheteEdit.luna} onChange={e => setPacheteEdit(p => ({...p, luna: parseInt(e.target.value)}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none">
                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">An</label>
              <input type="number" value={pacheteEdit.an} onChange={e => setPacheteEdit(p => ({...p, an: parseInt(e.target.value)}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Nr. pachete</label>
              <input type="number" value={pacheteEdit.pachete} onChange={e => setPacheteEdit(p => ({...p, pachete: e.target.value}))}
                placeholder="0" className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
          </div>
          <button onClick={handleSavePachete} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium">
            Salvează pachete
          </button>
        </div>
      )}

      {/* Soferi list */}
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-surface-200 h-20 animate-pulse" />)}</div>
      ) : soferi.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center">
          <p className="text-surface-400 text-sm">Niciun șofer configurat. Adaugă primul șofer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {soferi.map(s => {
            const pList = getPacheteForTura(s.tura);
            const totalPachete = pList.reduce((acc, p) => acc + (p.pachete || 0), 0);
            return (
              <div key={s.id} className="bg-white rounded-xl border border-surface-200 p-4 flex items-center gap-4 hover:border-surface-300 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                  <span className="font-display font-bold text-surface-700">{s.tura}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-surface-900 text-sm">{s.numeSofer}</div>
                  <div className="text-xs text-surface-500">Tura {s.tura} · {s.locatie} · {totalPachete.toLocaleString()} pachete total</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ tura: s.tura, numeSofer: s.numeSofer, locatie: s.locatie }); setEditingId(s.id); setShowForm(true); }}
                    className="p-2 rounded-lg text-surface-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(s.id, s.tura)}
                    className="p-2 rounded-lg text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
