# Reclamații App

Aplicație de gestiune reclamații pentru livratori, construită cu React + Firebase.

## Utilizatori

| Utilizator | Rol | Locație |
|---|---|---|
| Admin | Administrator complet | Toate |
| Tania | Șefă · vizualizare totală | Toate |
| Raluca | Operator | Ruhstorf |
| Mihaela | Operator | Ruhstorf |
| Mădălina | Operator | Eiselfing |

## Configurare

### 1. Clonează repo-ul
```bash
git clone https://github.com/YOUR_USERNAME/reclamatii-app.git
cd reclamatii-app
npm install
```

### 2. Configurează Firebase
Editează `src/lib/firebase.js` și înlocuiește valorile cu datele tale din Firebase Console:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Configurează Firestore Rules
În Firebase Console → Firestore → Rules, copiază conținutul din `firestore.rules`.

### 4. Pornește aplicația
```bash
npm run dev
```

### 5. Prima utilizare
- Deschide aplicația
- Selectează un utilizator
- La prima autentificare, fiecare utilizator va seta un PIN de 4 cifre
- Admin poate reseta PIN-urile din secțiunea **Utilizatori & PIN**

## Funcționalități

- ✅ Autentificare prin selecție utilizator + PIN (4 cifre)
- ✅ Adăugare reclamații cu toate detaliile
- ✅ Print automat formular client
- ✅ Marcare reclamații rezolvate/nerezolvate
- ✅ Upload Rechnunguri PDF/Excel lunare
- ✅ Verificare Rechnung vs reclamații rezolvate
- ✅ Statistici: top șoferi, medie reclamații/pachete, top adrese/persoane
- ✅ Grafice lunare evoluție reclamații
- ✅ Gestionare șoferi și ture
- ✅ Permisiuni pe locație (Ruhstorf/Eiselfing)

## Deploy pe Vercel

1. Push pe GitHub
2. Conectează repo-ul la [vercel.com](https://vercel.com)
3. Deploy automat ✓

## Stack tehnic

- React 18 + Vite
- Firebase (Firestore + Storage)
- Tailwind CSS
- Recharts (grafice)
- react-to-print (print formular)
