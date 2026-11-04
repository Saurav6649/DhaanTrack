import React, { createContext, useContext } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Primary auth state fetched from backend cookie session using SWR in-memory
  const { data, error, isLoading, mutate: revalidateUser } = useSWR('/api/auth/me', {
    shouldRetryOnError: false,
    revalidateOnFocus: true,
  });

  const user = data?.user || null;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isOperator = user?.role === 'USER';

  const login = async (userId, password) => {
    const res = await api.post('/api/auth/login', { userId, password });
    const loggedInUser = res.data?.data?.user;
    // Revalidate SWR me key with confirmed backend data
    await revalidateUser({ user: loggedInUser }, false);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Continue clearing local memory state
    }
    // Clear SWR in-memory cache
    await revalidateUser(null, false);
    // Clear all other cached data
    mutate(() => true, undefined, { revalidate: false });
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isOperator,
        isLoading,
        login,
        logout,
        changePassword,
        revalidateUser,
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
