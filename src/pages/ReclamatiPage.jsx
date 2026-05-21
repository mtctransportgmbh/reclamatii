import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeReclamatii, addReclamatie, updateReclamatie, deleteReclamatie, getSoferi } from '../lib/dataService';
import { canUserEdit } from '../lib/users';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import toast from 'react-hot-toast';
import PrintFormular from '../components/PrintFormular';
import { useReactToPrint } from 'react-to-print';

const EMPTY_FORM = {
  numePachet: '',
  numarPachet: '',
  numeClient: '',
  prenumeClient: '',
  adresaClient: '',
  dataReclamatie: format(new Date(), 'yyyy-MM-dd'),
  turaSofer: '',
  locatie: '',
  descriere: '',
  tipReclamatie: 'livrare',
};

const TIP_OPTIONS = ['livrare', 'deteriorare', 'pierdut', 'adresa gresita', 'altele'];

export default function ReclamatiPage() {
  const { currentUser } = useAuth();
  const canEdit = canUserEdit(currentUser);
  const [reclamatii, setReclamatii] = useState([]);
  const [soferi, setSoferi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, locatie: currentUser?.location || '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState({ status: 'all', locatie: currentUser?.location || 'all', search: '' });
  const [printData, setPrintData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const printRef = useRef();

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    const location = (currentUser?.role === 'admin' || currentUser?.role === 'tania') ? null : currentUser?.location;
    const unsub = subscribeReclamatii(location, (data) => {
      setReclamatii(data);
      setLoading(false);
    });
    getSoferi().then(setSoferi);
    return unsub;
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!form.numeClient || !form.numarPachet || !form.turaSofer) {
      toast.error('Completează câmpurile obligatorii');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        numeClient: `${form.numeClient} ${form.prenumeClient}`.trim(),
        dataReclamatie: new Date(form.dataReclamatie),
        adaugdeDe: currentUser.id,
        locatie: form.locatie || currentUser?.location,
      };

      if (editingId) {
        await updateReclamatie(editingId, payload);
        toast.success('Reclamație actualizată');
        setEditingId(null);
      } else {
        const docRef = await addReclamatie(payload);
        toast.success('Reclamație adăugată');
        // Offer to print
        setPrintData({ ...payload, id: docRef.id });
      }
      setForm({ ...EMPTY_FORM, locatie: currentUser?.location || '' });
      setShowForm(false);
    } catch (e) {
      toast.error('Eroare: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReclamatie(id, { status: newStatus });
      toast.success(newStatus === 'rezolvata' ? '✓ Marcată ca rezolvată' : 'Marcată ca nerezolvată');
    } catch {
      toast.error('Eroare la actualizare');
    }
  };

  const handleEdit = (r) => {
    const parts = (r.numeClient || '').split(' ');
    setForm({
      numePachet: r.numePachet || '',
      numarPachet: r.numarPachet || '',
      numeClient: parts[0] || '',
      prenumeClient: parts.slice(1).join(' ') || '',
      adresaClient: r.adresaClient || '',
      dataReclamatie: r.dataReclamatie ? format(r.dataReclamatie.toDate ? r.dataReclamatie.toDate() : new Date(r.dataReclamatie), 'yyyy-MM-dd') : '',
      turaSofer: r.turaSofer || '',
      locatie: r.locatie || '',
      descriere: r.descriere || '',
      tipReclamatie: r.tipReclamatie || 'livrare',
    });
    setEditingId(r.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Ștergi această reclamație?')) return;
    try {
      await deleteReclamatie(id);
      toast.success('Reclamație ștearsă');
    } catch {
      toast.error('Eroare la ștergere');
    }
  };

  const filtered = reclamatii.filter(r => {
    if (filter.status !== 'all' && r.status !== filter.status) return false;
    if (filter.locatie !== 'all' && r.locatie !== filter.locatie) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      return (r.numeClient || '').toLowerCase().includes(s) ||
             (r.numarPachet || '').toLowerCase().includes(s) ||
             (r.numePachet || '').toLowerCase().includes(s) ||
             (r.adresaClient || '').toLowerCase().includes(s);
    }
    return true;
  });

  const statusBadge = (s) => s === 'rezolvata'
    ? 'bg-green-50 text-green-700 border border-green-200'
    : 'bg-red-50 text-red-600 border border-red-200';

  const Input = ({ label, name, type = 'text', required, options, ...props }) => (
    <div>
      <label className="block text-xs font-medium text-surface-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {options ? (
        <select
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          {...props}
        >
          <option value="">Selectează...</option>
          {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          {...props}
        />
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Hidden print component */}
      <div className="hidden">
        <PrintFormular ref={printRef} data={printData} />
      </div>

      {/* Print notification */}
      {printData && (
        <div className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-glass-lg border border-surface-200 p-4 flex items-center gap-4 animate-slide-up max-w-xs">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-surface-900">Reclamație adăugată!</div>
            <div className="text-xs text-surface-500">Vrei să printezi formularul?</div>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => { handlePrint(); setPrintData(null); }}
              className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 font-medium">
              🖨 Print
            </button>
            <button onClick={() => setPrintData(null)}
              className="text-xs text-surface-400 hover:text-surface-600 text-center">
              Nu acum
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-surface-900 font-bold">Reclamații</h1>
          <p className="text-surface-500 text-sm mt-0.5">{filtered.length} înregistrări</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...EMPTY_FORM, locatie: currentUser?.location || '' }); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Reclamație nouă
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-6 shadow-glass animate-slide-up">
          <h2 className="font-display text-base font-semibold text-surface-900 mb-4">
            {editingId ? 'Editează reclamație' : 'Adaugă reclamație nouă'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="Nume pachet" name="numePachet" placeholder="ex: DHL Express" />
            <Input label="Număr pachet" name="numarPachet" required placeholder="ex: 1234567890" />
            <Input label="Nume client" name="numeClient" required placeholder="Nume" />
            <Input label="Prenume client" name="prenumeClient" placeholder="Prenume" />
            <Input label="Adresă client" name="adresaClient" placeholder="Strada, nr., localitate" />
            <Input label="Data reclamației" name="dataReclamatie" type="date" required />
            <Input label="Tura șofer" name="turaSofer" required
              options={soferi.length > 0
                ? soferi.map(s => ({ value: s.tura, label: `Tura ${s.tura} — ${s.numeSofer}` }))
                : [{ value: '', label: 'Niciun șofer configurat' }]}
            />
            <Input label="Locație" name="locatie"
              options={['Ruhstorf', 'Eiselfing']}
            />
            <Input label="Tip reclamație" name="tipReclamatie"
              options={TIP_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Descriere reclamație</label>
            <textarea
              value={form.descriere}
              onChange={e => setForm(f => ({ ...f, descriere: e.target.value }))}
              rows={3}
              placeholder="Detalii suplimentare..."
              className="w-full text-sm border border-surface-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {editingId ? 'Salvează modificări' : 'Adaugă reclamație'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2.5 text-surface-600 hover:bg-surface-100 rounded-xl text-sm font-medium transition-colors"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Caută client, pachet, adresă..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          className="flex-1 min-w-48 text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none"
        >
          <option value="all">Toate statusurile</option>
          <option value="nerezolvata">Nerezolvate</option>
          <option value="rezolvata">Rezolvate</option>
        </select>
        {(currentUser?.role === 'admin' || currentUser?.role === 'tania') && (
          <select
            value={filter.locatie}
            onChange={e => setFilter(f => ({ ...f, locatie: e.target.value }))}
            className="text-sm border border-surface-200 rounded-xl px-3 py-2 bg-white focus:outline-none"
          >
            <option value="all">Toate locațiile</option>
            <option value="Ruhstorf">Ruhstorf</option>
            <option value="Eiselfing">Eiselfing</option>
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-200 h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center">
          <p className="text-surface-400 text-sm">Nicio reclamație găsită</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt || Date.now());
            return (
              <div key={r.id} className="bg-white rounded-xl border border-surface-200 p-4 hover:border-surface-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-surface-900">{r.numeClient}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(r.status)}`}>
                        {r.status === 'rezolvata' ? '✓ Rezolvată' : '✗ Nerezolvată'}
                      </span>
                      {r.locatie && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 border border-surface-200">
                          {r.locatie}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {r.tipReclamatie || 'livrare'}
                      </span>
                    </div>
                    <div className="text-xs text-surface-500 flex flex-wrap gap-x-3">
                      <span>📦 {r.numePachet} #{r.numarPachet}</span>
                      <span>🚚 Tura {r.turaSofer}</span>
                      <span>📅 {format(d, 'dd MMM yyyy', { locale: ro })}</span>
                      {r.adresaClient && <span>📍 {r.adresaClient}</span>}
                    </div>
                    {r.descriere && <p className="text-xs text-surface-400 mt-1 italic">"{r.descriere}"</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Toggle status */}
                    {canEdit && (
                      <button
                        onClick={() => handleStatusChange(r.id, r.status === 'rezolvata' ? 'nerezolvata' : 'rezolvata')}
                        className={`p-2 rounded-lg transition-colors text-xs font-medium ${
                          r.status === 'rezolvata'
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-surface-100 text-surface-500 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title={r.status === 'rezolvata' ? 'Marchează nerezolvată' : 'Marchează rezolvată'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    )}
                    {/* Print */}
                    <button
                      onClick={() => { setPrintData(r); setTimeout(handlePrint, 100); }}
                      className="p-2 rounded-lg bg-surface-100 text-surface-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Printează formular"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                      </svg>
                    </button>
                    {/* Edit */}
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-2 rounded-lg bg-surface-100 text-surface-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                        title="Editează"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                    )}
                    {/* Delete (admin only) */}
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-2 rounded-lg bg-surface-100 text-surface-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Șterge"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
