import { getAllUsers, saveAllUsers } from '@/lib/storage';

const initialAdminUser = {
  id: 'admin_user',
  email: 'admin',
  name: 'Administrador',
  password: '24041983kmh*',
  isAdmin: true,
  createdAt: new Date().toISOString(),
};

export const initializeUsers = () => {
  const users = getAllUsers();
  if (users.length === 0) {
    saveAllUsers([initialAdminUser]);
  } else {
    const adminExists = users.some(u => u.id === 'admin_user' && u.isAdmin);
    if (!adminExists) {
      saveAllUsers([initialAdminUser, ...users.filter(u => u.id !== 'admin_user')]);
    }
  }
};

export const getUsers = () => {
  initializeUsers();
  return getAllUsers();
};

export const saveUsers = (users) => {
  saveAllUsers(users);
};