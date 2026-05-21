import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

const PrintFormular = forwardRef(function PrintFormular({ data }, ref) {
  if (!data) return <div ref={ref} />;

  const getDate = (d) => {
    if (!d) return '—';
    try {
      const dt = d.toDate ? d.toDate() : new Date(d);
      return format(dt, 'dd MMMM yyyy', { locale: ro });
    } catch { return '—'; }
  };

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', padding: '32px', maxWidth: '720px', margin: '0 auto', color: '#111' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>FORMULAR RECLAMAȚIE</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>Livrare pachet</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#555' }}>
          <div><strong>Data:</strong> {getDate(data.dataReclamatie)}</div>
          <div><strong>Nr. pachet:</strong> {data.numarPachet || '—'}</div>
          <div><strong>Locație:</strong> {data.locatie || '—'}</div>
        </div>
      </div>

      {/* Section: Pachet */}
      <div style={{ marginBottom: '20px', padding: '14px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', margin: '0 0 12px' }}>Informații pachet</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field label="Nume pachet / Curier" value={data.numePachet} />
          <Field label="Număr tracking" value={data.numarPachet} />
          <Field label="Tip reclamație" value={data.tipReclamatie} />
          <Field label="Tura șofer" value={`Tura ${data.turaSofer}`} />
        </div>
      </div>

      {/* Section: Client */}
      <div style={{ marginBottom: '20px', padding: '14px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', margin: '0 0 12px' }}>Date client</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Field label="Nume și prenume" value={data.numeClient} />
          <Field label="Adresă livrare" value={data.adresaClient} />
        </div>
      </div>

      {/* Section: Reclamatie */}
      <div style={{ marginBottom: '20px', padding: '14px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', margin: '0 0 12px' }}>Conținut reclamație</h3>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Descriere reclamație</div>
          <div style={{ minHeight: '60px', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '8px', fontSize: '13px' }}>
            {data.descriere || ''}
          </div>
        </div>
      </div>

      {/* Section: Completat de client */}
      <div style={{ marginBottom: '24px', padding: '14px', border: '2px dashed #aaa', borderRadius: '6px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#555', margin: '0 0 12px' }}>
          ✏️ De completat de client
        </h3>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Descrierea problemei (în cuvintele clientului)</div>
          <div style={{ height: '60px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Telefon contact</div>
            <div style={{ height: '30px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Email</div>
            <div style={{ height: '30px', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Soluție dorită</div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
            {['Returnare bani', 'Re-livrare', 'Compensație', 'Altele'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '14px', border: '1.5px solid #555', borderRadius: '3px', display: 'inline-block' }} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '40px' }}>Semnătură client</div>
          <div style={{ borderTop: '1px solid #333' }} />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Dată: ___________________</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '40px' }}>Semnătură operator</div>
          <div style={{ borderTop: '1px solid #333' }} />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Dată: ___________________</div>
        </div>
      </div>

      {/* Status box (for later use) */}
      <div style={{ padding: '10px 14px', background: '#f8f9fc', border: '1px solid #e4e8f4', borderRadius: '6px', display: 'flex', gap: '24px', fontSize: '12px' }}>
        <strong>Status:</strong>
        {['Înregistrată', 'În curs', 'Rezolvată', 'Refuzată'].map(s => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '12px', height: '12px', border: '1px solid #666', borderRadius: '50%', display: 'inline-block' }} />
            {s}
          </label>
        ))}
      </div>

      <div style={{ marginTop: '16px', fontSize: '10px', color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        Reclamații App · Generat automat · {format(new Date(), 'dd.MM.yyyy HH:mm')}
      </div>
    </div>
  );
});

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '500', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
        {value || '—'}
      </div>
    </div>
  );
}

export default PrintFormular;
