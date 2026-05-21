import { db, storage } from './firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc,
  query, where, orderBy, limit, Timestamp, onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ─── RECLAMAȚII ──────────────────────────────────────────────

export async function addReclamatie(data) {
  return await addDoc(collection(db, 'reclamatii'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'nerezolvata',
  });
}

export async function updateReclamatie(id, data) {
  return await updateDoc(doc(db, 'reclamatii', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteReclamatie(id) {
  return await deleteDoc(doc(db, 'reclamatii', id));
}

export function subscribeReclamatii(location, callback) {
  let q;
  if (location) {
    q = query(
      collection(db, 'reclamatii'),
      where('locatie', '==', location),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, 'reclamatii'), orderBy('createdAt', 'desc'));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function getReclamatiiBySofer(turaSofer) {
  const q = query(
    collection(db, 'reclamatii'),
    where('turaSofer', '==', turaSofer),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllReclamatii() {
  const q = query(collection(db, 'reclamatii'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── SOFERI / TURE ───────────────────────────────────────────

export async function addSofer(data) {
  return await addDoc(collection(db, 'soferi'), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

export async function getSoferi() {
  const snap = await getDocs(query(collection(db, 'soferi'), orderBy('tura')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateSofer(id, data) {
  return await updateDoc(doc(db, 'soferi', id), data);
}

export async function deleteSofer(id) {
  return await deleteDoc(doc(db, 'soferi', id));
}

// Pachete livrate per sofer per luna
export async function setPachetelivrate(turaSofer, luna, an, pachete) {
  const id = `${turaSofer}_${an}_${String(luna).padStart(2,'0')}`;
  const docRef = doc(db, 'pachete_livrate', id);
  return await updateDoc(docRef, { pachete, updatedAt: Timestamp.now() })
    .catch(() => addDoc(collection(db, 'pachete_livrate'), {
      turaSofer, luna, an, pachete, id,
      updatedAt: Timestamp.now()
    }));
}

export async function getPachetelivrate(turaSofer, luna, an) {
  const id = `${turaSofer}_${an}_${String(luna).padStart(2,'0')}`;
  const snap = await getDoc(doc(db, 'pachete_livrate', id));
  return snap.exists() ? snap.data().pachete : 0;
}

export async function getAllPachetelivrate() {
  const snap = await getDocs(collection(db, 'pachete_livrate'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── RECHNUNGURI ─────────────────────────────────────────────

export async function addRechnung(file, metadata) {
  // Upload file to Storage
  const storageRef = ref(storage, `rechnunguri/${metadata.an}/${metadata.luna}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return await addDoc(collection(db, 'rechnunguri'), {
    ...metadata,
    fileName: file.name,
    fileURL: downloadURL,
    uploadedAt: Timestamp.now(),
  });
}

export async function getRechnunguri() {
  const snap = await getDocs(query(collection(db, 'rechnunguri'), orderBy('uploadedAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateRechnungStatus(id, data) {
  return await updateDoc(doc(db, 'rechnunguri', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// ─── STATISTICI ──────────────────────────────────────────────

export async function getStatistici() {
  const [reclamatii, soferi, pachete] = await Promise.all([
    getAllReclamatii(),
    getSoferi(),
    getAllPachetelivrate(),
  ]);

  // Reclamatii per sofer
  const perSofer = {};
  reclamatii.forEach(r => {
    if (!perSofer[r.turaSofer]) perSofer[r.turaSofer] = { total: 0, rezolvate: 0, nerezolvate: 0 };
    perSofer[r.turaSofer].total++;
    if (r.status === 'rezolvata') perSofer[r.turaSofer].rezolvate++;
    else perSofer[r.turaSofer].nerezolvate++;
  });

  // Pachete per sofer
  const pachetelemap = {};
  pachete.forEach(p => {
    if (!pachetelemap[p.turaSofer]) pachetelemap[p.turaSofer] = 0;
    pachetelemap[p.turaSofer] += p.pachete;
  });

  // Top soferi cu medie
  const topSoferi = soferi.map(s => {
    const stats = perSofer[s.tura] || { total: 0, rezolvate: 0, nerezolvate: 0 };
    const totalPachete = pachetelemap[s.tura] || 0;
    const medie = totalPachete > 0 ? ((stats.total / totalPachete) * 100).toFixed(2) : null;
    return { ...s, ...stats, totalPachete, medie };
  }).sort((a, b) => b.total - a.total);

  // Reclamatii per luna
  const perLuna = {};
  reclamatii.forEach(r => {
    if (!r.dataReclamatie) return;
    const date = r.dataReclamatie.toDate ? r.dataReclamatie.toDate() : new Date(r.dataReclamatie);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    if (!perLuna[key]) perLuna[key] = { total: 0, rezolvate: 0 };
    perLuna[key].total++;
    if (r.status === 'rezolvata') perLuna[key].rezolvate++;
  });

  // Top adrese reclamate
  const perAdresa = {};
  reclamatii.forEach(r => {
    if (!r.adresaClient) return;
    const key = r.adresaClient.toLowerCase().trim();
    if (!perAdresa[key]) perAdresa[key] = { adresa: r.adresaClient, total: 0 };
    perAdresa[key].total++;
  });
  const topAdrese = Object.values(perAdresa).sort((a, b) => b.total - a.total).slice(0, 10);

  // Top persoane reclamante
  const perPersoana = {};
  reclamatii.forEach(r => {
    if (!r.numeClient) return;
    const key = r.numeClient.toLowerCase().trim();
    if (!perPersoana[key]) perPersoana[key] = { nume: r.numeClient, total: 0 };
    perPersoana[key].total++;
  });
  const topPersoane = Object.values(perPersoana).sort((a, b) => b.total - a.total).slice(0, 10);

  return { topSoferi, perLuna, topAdrese, topPersoane, total: reclamatii.length, reclamatii };
}
