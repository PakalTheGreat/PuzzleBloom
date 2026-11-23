import React, { createContext, useContext, useMemo, useState } from "react";

export type ActiveRole = "grower" | "specialist";

type RoleContextValue = {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  toggleRole: () => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<ActiveRole>("grower");

  const value = useMemo(
    () => ({
      activeRole,
      setActiveRole,
      toggleRole: () =>
        setActiveRole((r) => (r === "grower" ? "specialist" : "grower")),
    }),
    [activeRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useActiveRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useActiveRole must be used within RoleProvider");
  }
  return ctx;
}
