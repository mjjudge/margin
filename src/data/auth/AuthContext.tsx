// src/data/auth/AuthContext.tsx
// Auth state management with Supabase

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'apple' | 'google') => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    initialized: false,
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setState({
            session,
            user: session?.user ?? null,
            loading: false,
            initialized: true,
          });
        }
      } catch (err) {
        console.error('[AuthContext] Failed to get session:', err);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setState({
            session,
            user: session?.user ?? null,
            loading: false,
            initialized: true,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Use the app scheme for deep link redirect
          emailRedirectTo: 'margin://auth/callback',
        },
      });
      setState(prev => ({ ...prev, loading: false }));
      return { error: error as Error | null };
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: err as Error };
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'apple' | 'google') => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'margin://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      setState(prev => ({ ...prev, loading: false }));
      return { error: error as Error | null };
    } catch (err) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async (): Promise<{ error: Error | null }> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      setState({
        session: null,
        user: null,
        loading: false,
        initialized: true,
      });
      return { error: error as Error | null };
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
      setState({
        session: null,
        user: null,
        loading: false,
        initialized: true,
      });
      return { error: err as Error };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));
    } catch (err) {
      console.error('[AuthContext] Refresh session error:', err);
    }
  }, []);

  const value: AuthContextValue = {
    ...state,
    signInWithEmail,
    signInWithOAuth,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
