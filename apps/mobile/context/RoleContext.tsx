import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { setActiveRole } from "@cwg/api";
import type { ActiveRole } from "@cwg/types";

import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

type RoleContextValue = {
  activeRole: ActiveRole;
  setActiveRoleLocal: (role: ActiveRole) => void;
  toggleRole: () => void;
  canToggle: boolean;
};

const STORAGE_KEY = "cwg.active_role";
const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, me, demoMode, demoSession, setDemoActiveRole, refreshMe } =
    useAuth();
  const [activeRole, setActiveRoleState] = useState<ActiveRole>("grower");

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "grower" || stored === "specialist") {
        setActiveRoleState(stored);
      }
    });
  }, []);

  useEffect(() => {
    if (demoMode && demoSession) {
      const role =
        demoSession.activeRole === "admin"
          ? "specialist"
          : (demoSession.activeRole as ActiveRole);
      if (role === "grower" || role === "specialist") {
        setActiveRoleState(role);
      }
      return;
    }
    const fromDb = (me?.user as { active_role?: ActiveRole } | null)?.active_role;
    if (fromDb === "grower" || fromDb === "specialist") {
      setActiveRoleState(fromDb);
    }
  }, [demoMode, demoSession, me?.user]);

  const canToggle = Boolean(
    me?.roles?.includes("grower") && me?.roles?.includes("specialist"),
  );

  const setActiveRoleLocal = useCallback(
    (role: ActiveRole) => {
      setActiveRoleState(role);
      void SecureStore.setItemAsync(STORAGE_KEY, role);
      if (demoMode) {
        void setDemoActiveRole(role);
        return;
      }
      const client = getSupabase();
      if (client && user) {
        void setActiveRole(client, user.id, role).then(() => refreshMe());
      }
    },
    [demoMode, setDemoActiveRole, user, refreshMe],
  );

  const value = useMemo(
    () => ({
      activeRole,
      setActiveRoleLocal,
      canToggle,
      toggleRole: () => {
        if (!canToggle) return;
        setActiveRoleLocal(activeRole === "grower" ? "specialist" : "grower");
      },
    }),
    [activeRole, setActiveRoleLocal, canToggle],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useActiveRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useActiveRole must be used within RoleProvider");
  return ctx;
}
