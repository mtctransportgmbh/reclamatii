import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRechnunguri, addRechnung, updateRechnungStatus, getAllReclamatii } from '../lib/dataService';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MONTHS_RO = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

export default function RechnunguriPage() {
  const { currentUser } = useAuth();
  const [rechnunguri, setRechnunguri] = useState([]);
  const [reclamatii, setReclamatii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ luna: new Date().getMonth() + 1, an: new Date().getFullYear(), suma: '', descriere: '' });
  const [uploading, setUploading] = useState(false);
  const [selectedR, setSelectedR] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [r, rec] = await Promise.all([getRechnunguri(), getAllReclamatii()]);
    setRechnunguri(r);
    setReclamatii(rec);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Selectează un fișier');
    setUploading(true);
    try {
      await addRechnung(file, { ...meta, luna: parseInt(meta.luna), an: parseInt(meta.an) });
      toast.success('Rechnung uploadat cu succes');
      setFile(null);
      setShowUpload(false);
      load();
    } catch (e) {
      toast.error('Eroare upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerificare = async (id, data) => {
    try {
      await updateRechnungStatus(id, data);
      toast.success('Status actualizat');
      load();
    } catch {
      toast.error('Eroare');
    }
  };

  // Get resolved complaints for a given month/year
  const getReclamatiPentruLuna = (luna, an) => {
    return reclamatii.filter(r => {
      if (!r.createdAt) return false;
      const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return d.getMonth() + 1 === luna && d.getFullYear() === an;
    });
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'tania') {
    return <div className="p-6 text-center"><p className="text-surface-500">Acces restricționat</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-surface-900 font-bold">Rechnunguri</h1>
          <p className="text-surface-500 text-sm mt-0.5">Facturi lunare · Verificare vs reclamații rezolvate</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Rechnung
          </button>
        )}
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-6 shadow-glass animate-slide-up">
          <h2 className="font-semibold text-surface-900 mb-4">Upload Rechnung nou</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Luna</label>
              <select value={meta.luna} onChange={e => setMeta(m => ({...m, luna: e.target.value}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none">
                {MONTHS_RO.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">An</label>
              <input type="number" value={meta.an} onChange={e => setMeta(m => ({...m, an: e.target.value}))}
                className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Sumă (€)</label>
              <input type="number" value={meta.suma} onChange={e => setMeta(m => ({...m, suma: e.target.value}))}
                placeholder="0.00" className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Fișier (PDF/Excel)</label>
              <input type="file" accept=".pdf,.xlsx,.xls,.csv"
                onChange={e => setFile(e.target.files[0])}
                className="w-full text-xs border border-surface-200 rounded-xl px-3 py-2.5 file:mr-2 file:text-xs file:bg-brand-50 file:text-brand-600 file:border-0 file:rounded-lg file:px-2 file:py-1" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-surface-600 mb-1">Note</label>
            <input value={meta.descriere} onChange={e => setMeta(m => ({...m, descriere: e.target.value}))}
              placeholder="ex: Rechnung DHL Ianuarie 2025" className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none" />
          </div>
          <button onClick={handleUpload} disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {uploading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Uploadează
          </button>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div className="text-sm text-blue-800">
          <strong>Cum funcționează:</strong> Pentru fiecare rechnung lunar, poți verifica câte reclamații din acea lună au fost rezolvate de șoferi. Dacă firma tot a emis factura deși reclamația era rezolvată, marchează ca „Dispută".
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-surface-200 h-32 animate-pulse" />)}</div>
      ) : rechnunguri.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center">
          <p className="text-surface-400 text-sm">Niciun rechnung uploadat</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rechnunguri.map(r => {
            const reclamatiiLuna = getReclamatiPentruLuna(r.luna, r.an);
            const rezolvate = reclamatiiLuna.filter(rc => rc.status === 'rezolvata');
            const nerezolvate = reclamatiiLuna.filter(rc => rc.status !== 'rezolvata');
            const isExpanded = selectedR === r.id;
            const uploadDate = r.uploadedAt?.toDate ? r.uploadedAt.toDate() : new Date(r.uploadedAt || Date.now());

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-surface-200 shadow-glass overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-surface-900">{MONTHS_RO[r.luna - 1]} {r.an}</span>
                        {r.suma && <span className="text-sm font-mono text-surface-700">€{parseFloat(r.suma).toFixed(2)}</span>}
                        {r.disputat && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full font-medium">⚠ Dispută</span>}
                        {r.verificat && !r.disputat && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full font-medium">✓ Verificat</span>}
                      </div>
                      <div className="text-xs text-surface-500 mb-2">
                        {r.descriere && <span className="mr-3">{r.descriere}</span>}
                        <span>Uploadat: {format(uploadDate, 'dd MMM yyyy', { locale: ro })}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="text-surface-600">📋 {reclamatiiLuna.length} reclamații în lună</span>
                        <span className="text-green-600">✓ {rezolvate.length} rezolvate</span>
                        <span className="text-red-500">✗ {nerezolvate.length} nerezolvate</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {r.fileURL && (
                        <a href={r.fileURL} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Deschide fișier
                        </a>
                      )}
                      <button onClick={() => setSelectedR(isExpanded ? null : r.id)}
                        className="text-xs px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg transition-colors">
                        {isExpanded ? 'Ascunde' : 'Detalii'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-surface-100 p-5 bg-surface-50 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-surface-800">Reclamații în {MONTHS_RO[r.luna - 1]} {r.an}</h3>
                      {currentUser?.role === 'admin' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleVerificare(r.id, { verificat: true, disputat: false })}
                            className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            ✓ Marchează verificat
                          </button>
                          <button onClick={() => handleVerificare(r.id, { disputat: true, motivDisputa: 'Reclamații rezolvate dar facturate', verificat: false })}
                            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            ⚠ Marchează dispută
                          </button>
                        </div>
                      )}
                    </div>
                    {reclamatiiLuna.length === 0 ? (
                      <p className="text-sm text-surface-400">Nicio reclamație în această lună</p>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {reclamatiiLuna.map(rc => (
                          <div key={rc.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-surface-200">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rc.status === 'rezolvata' ? 'bg-green-500' : 'bg-red-400'}`} />
                            <span className="text-xs text-surface-700 flex-1">{rc.numeClient} · #{rc.numarPachet}</span>
                            <span className="text-xs text-surface-500">T.{rc.turaSofer}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${rc.status === 'rezolvata' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                              {rc.status === 'rezolvata' ? 'Rezolvată' : 'Nerezolvată'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {rezolvate.length > 0 && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-800">
                          <strong>Atenție:</strong> {rezolvate.length} reclamație(i) din această lună au fost rezolvate de șoferi.
                          Verificați dacă firma a facturat costurile în ciuda rezolvării.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
