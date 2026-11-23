import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { fetchMe, type MeBundle } from "@cwg/api";

import { getMobileEnv, getSupabase } from "@/lib/supabase";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  me: MeBundle | null;
  refreshMe: () => Promise<void>;
  signOutLocal: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = getMobileEnv().configured;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeBundle | null>(null);

  const refreshMe = useCallback(async () => {
    const client = getSupabase();
    if (!client || !session?.user) {
      setMe(null);
      return;
    }
    const bundle = await fetchMe(client, session.user.id);
    setMe(bundle);
  }, [session?.user]);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      void refreshMe();
    } else {
      setMe(null);
    }
  }, [session?.user, refreshMe]);

  const signOutLocal = useCallback(async () => {
    const client = getSupabase();
    if (client) await client.auth.signOut();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      me,
      refreshMe,
      signOutLocal,
    }),
    [configured, loading, session, me, refreshMe, signOutLocal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
