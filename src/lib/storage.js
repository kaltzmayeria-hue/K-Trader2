const USERS_KEY = 'users';

export const getAllUsers = () => {
  try {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
    return [];
  }
};

export const saveAllUsers = (users) => {
  try {
    const usersJson = JSON.stringify(users);
    localStorage.setItem(USERS_KEY, usersJson);
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};

export const getFromStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
    return null;
  }
};

export const saveToStorage = (key, value) => {
  try {
    const valueJson = JSON.stringify(value);
    localStorage.setItem(key, valueJson);
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
};