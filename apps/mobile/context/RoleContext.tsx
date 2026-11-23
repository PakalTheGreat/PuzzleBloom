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
};

const STORAGE_KEY = "cwg.active_role";
const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, me, refreshMe } = useAuth();
  const [activeRole, setActiveRoleState] = useState<ActiveRole>("grower");

  useEffect(() => {
    void SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "grower" || stored === "specialist") {
        setActiveRoleState(stored);
      }
    });
  }, []);

  useEffect(() => {
    const fromDb = (me?.user as { active_role?: ActiveRole } | null)?.active_role;
    if (fromDb === "grower" || fromDb === "specialist") {
      setActiveRoleState(fromDb);
    }
  }, [me?.user]);

  const setActiveRoleLocal = useCallback(
    (role: ActiveRole) => {
      setActiveRoleState(role);
      void SecureStore.setItemAsync(STORAGE_KEY, role);
      const client = getSupabase();
      if (client && user) {
        void setActiveRole(client, user.id, role).then(() => refreshMe());
      }
    },
    [user, refreshMe],
  );

  const value = useMemo(
    () => ({
      activeRole,
      setActiveRoleLocal,
      toggleRole: () =>
        setActiveRoleLocal(activeRole === "grower" ? "specialist" : "grower"),
    }),
    [activeRole, setActiveRoleLocal],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useActiveRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useActiveRole must be used within RoleProvider");
  return ctx;
}
