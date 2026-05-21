// Utilizatorii predefiniti ai aplicatiei
// PIN-urile sunt setate la prima autentificare si stocate in Firestore (hash simplu)
// Admin poate reseta PIN-ul oricand

export const USERS = [
  {
    id: 'admin',
    name: 'Admin',
    displayName: 'Administrator',
    role: 'admin',
    location: null, // vede toate locatiile
    avatar: 'A',
    color: '#6366f1',
    bgColor: '#e0e9ff',
  },
  {
    id: 'tania',
    name: 'Tania',
    displayName: 'Tania',
    role: 'tania', // sefa - vede tot, nu editeaza
    location: null,
    avatar: 'T',
    color: '#0891b2',
    bgColor: '#cffafe',
  },
  {
    id: 'raluca',
    name: 'Raluca',
    displayName: 'Raluca',
    role: 'operator',
    location: 'Ruhstorf',
    avatar: 'R',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  {
    id: 'mihaela',
    name: 'Mihaela',
    displayName: 'Mihaela',
    role: 'operator',
    location: 'Ruhstorf',
    avatar: 'M',
    color: '#059669',
    bgColor: '#d1fae5',
  },
  {
    id: 'madalina',
    name: 'Mădălina',
    displayName: 'Mădălina',
    role: 'operator',
    location: 'Eiselfing',
    avatar: 'Md',
    color: '#db2777',
    bgColor: '#fce7f3',
  },
];

export const LOCATIONS = ['Ruhstorf', 'Eiselfing'];

export const getUserById = (id) => USERS.find(u => u.id === id);

export const canUserSeeLocation = (user, location) => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'tania') return true;
  return user.location === location;
};

export const canUserEdit = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'operator';
};

export const isAdmin = (user) => user?.role === 'admin';
