"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { writeDemoSessionClient } from "@/lib/demo/client-session";
import type { AppRole, DemoSession } from "@cwg/demo";

export function RoleSwitcher({
  roles,
  activeRole,
}: {
  roles: AppRole[];
  activeRole: AppRole;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchRole(role: AppRole) {
    if (role === activeRole) return;
    setLoading(true);
    const res = await fetch("/api/demo/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = (await res.json()) as { session?: DemoSession };
    if (json.session) writeDemoSessionClient(json.session);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-[var(--cwg-text-secondary)]">Alternar papel ativo</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {roles
          .filter((r) => r !== "admin")
          .map((role) => (
            <button
              key={role}
              type="button"
              disabled={loading}
              onClick={() => void switchRole(role)}
              className={`rounded-[10px] px-3 py-1.5 text-sm ${
                role === activeRole
                  ? "bg-[var(--cwg-green)] text-white"
                  : "border border-[var(--cwg-graphite-200)]"
              }`}
            >
              {role === "specialist" ? "Especialista" : "Cultivador"}
            </button>
          ))}
      </div>
    </div>
  );
}
