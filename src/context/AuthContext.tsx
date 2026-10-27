import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/models';
import { dataStore } from '../services/storage';
import { signInWithGoogle, signOutFirebase, isFirebaseConfigured } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: (role: 'main_admin' | 'user') => void;
  logout: () => void;
  isMainAdmin: boolean;
  isFirebaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAIN_ADMIN_EMAIL = (import.meta.env.MAIN_ADMIN_EMAIL || 'ifti@kajtracker.com').toLowerCase();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kaj_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default to initial admin in development mode for convenience
    return dataStore.getUsers()[0] || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kaj_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kaj_current_user');
      localStorage.removeItem('kaj_auth_token');
    }
  }, [currentUser]);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { user: fbUser, token } = await signInWithGoogle();
      const email = fbUser.email?.toLowerCase() || '';
      const isMainAdmin = email === MAIN_ADMIN_EMAIL;

      // Check if user exists in Sheets/Store, else register
      let existingUser = dataStore.getUserByEmail(email);
      if (!existingUser) {
        existingUser = {
          uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          name_bn: fbUser.displayName || undefined,
          email: fbUser.email || '',
          role: isMainAdmin ? 'main_admin' : 'user',
          createdAt: new Date().toISOString(),
          avatarUrl: fbUser.photoURL || undefined,
        };
        dataStore.saveUser(existingUser);
      } else {
        // Update role if newly matching main admin email
        if (isMainAdmin && existingUser.role !== 'main_admin') {
          existingUser.role = 'main_admin';
          dataStore.saveUser(existingUser);
        }
      }

      localStorage.setItem('kaj_auth_token', token);
      setCurrentUser(existingUser);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (role: 'main_admin' | 'user') => {
    const users = dataStore.getUsers();
    const targetUser = role === 'main_admin'
      ? users.find((u) => u.role === 'main_admin') || users[0]
      : users.find((u) => u.role === 'user') || users[1];

    if (targetUser) {
      localStorage.setItem('kaj_auth_token', `dev_token_${targetUser.uid}`);
      setCurrentUser(targetUser);
    }
  };

  const logout = () => {
    signOutFirebase().catch(console.warn);
    setCurrentUser(null);
    localStorage.removeItem('kaj_current_user');
    localStorage.removeItem('kaj_auth_token');
  };

  const isMainAdmin = currentUser?.role === 'main_admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithGoogle,
        loginAsDemo,
        logout,
        isMainAdmin,
        isFirebaseAvailable: isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
