"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LEGAL_COPY } from "@cwg/shared";

import {
  readCultivationAuthClient,
  writeCultivationAuthClient,
} from "@/lib/legal-auth";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks login/signup (including Google) until the user explicitly accepts
 * the pre-auth cultivation-authorization declaration.
 */
export function LegalAuthGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAccepted(Boolean(readCultivationAuthClient()));
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className="text-sm text-[var(--cwg-text-secondary)]">Carregando…</p>
    );
  }

  if (accepted) return <>{children}</>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-auth-title"
      className="rounded-[12px] border border-[var(--cwg-graphite-200)] bg-white p-6 shadow-sm"
      data-testid="legal-auth-gate"
    >
      <h2
        id="legal-auth-title"
        className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--cwg-green-deep)]"
      >
        {LEGAL_COPY.cultivationAuthTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--cwg-text)]">
        {LEGAL_COPY.cultivationAuthBody}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--cwg-text-secondary)]">
        {LEGAL_COPY.cultivationAuthDisclaimer}
      </p>
      <p className="mt-4 text-xs text-[var(--cwg-text-secondary)]">
        Consulte também os{" "}
        <Link href="/docs/lgpd" className="text-[var(--cwg-green)] underline">
          Termos e Privacidade (LGPD)
        </Link>
        .
      </p>
      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>{LEGAL_COPY.cultivationAuthCheckbox}</span>
      </label>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          disabled={!checked}
          onClick={() => {
            writeCultivationAuthClient();
            setAccepted(true);
          }}
          className="w-full rounded-[10px] bg-[var(--cwg-green)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--cwg-green-deep)] disabled:opacity-50"
        >
          {LEGAL_COPY.cultivationAuthContinue}
        </button>
        <Link
          href="/"
          className="text-center text-sm text-[var(--cwg-text-secondary)] hover:underline"
        >
          {LEGAL_COPY.cultivationAuthDecline}
        </Link>
      </div>
    </div>
  );
}
