import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../services/auth';
import {
  UNAUTHORIZED_EVENT,
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
  saveUser,
} from '../services/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  const signOutLocal = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => signOutLocal();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [signOutLocal]);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let active = true;
    authApi
      .me()
      .then((json) => {
        if (!active) return;
        const fresh = json?.data?.user;
        if (fresh) {
          setUser(fresh);
          saveUser(fresh);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const applyAuthResponse = useCallback((json) => {
    const token = json?.data?.token;
    const nextUser = json?.data?.user;
    if (token && nextUser) {
      saveSession(token, nextUser);
      setUser(nextUser);
    }
    return json;
  }, []);

  const signIn = useCallback(
    async (email, password) => applyAuthResponse(await authApi.login(email, password)),
    [applyAuthResponse]
  );

  const signUp = useCallback(
    async (payload) => applyAuthResponse(await authApi.register(payload)),
    [applyAuthResponse]
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    signOutLocal();
  }, [signOutLocal]);

  const refreshUser = useCallback(async () => {
    const json = await authApi.me();
    const fresh = json?.data?.user;
    if (fresh) {
      setUser(fresh);
      saveUser(fresh);
    }
    return fresh;
  }, []);

  const patchUser = useCallback((partial) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...partial };
      saveUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isProvider: user?.profile_type === 'provider',
      isClient: user?.profile_type === 'client',
      signIn,
      signUp,
      signOut,
      refreshUser,
      patchUser,
      adoptSession: applyAuthResponse,
    }),
    [user, loading, signIn, signUp, signOut, refreshUser, patchUser, applyAuthResponse]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
};
