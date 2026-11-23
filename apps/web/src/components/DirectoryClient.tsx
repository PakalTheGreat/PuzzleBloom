"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceKm, sortByDistance, type Locatable } from "@cwg/shared";

type Row = Locatable & {
  id: string;
  slug: string;
  headline?: string | null;
  verification_status?: string | null;
  users?: { full_name?: string } | null;
  distance_km?: number | null;
};

type Props = {
  initialRows: Row[];
  initialQuery: {
    q?: string;
    estado?: string;
    cidade?: string;
    mode?: string;
    lat?: string;
    lng?: string;
  };
};

export function DirectoryClient({ initialRows, initialQuery }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "prompting" | "granted" | "denied" | "unavailable"
  >("idle");
  const [originLabel, setOriginLabel] = useState<string | null>(null);

  const mode = initialQuery.mode || "all";

  function applyOrigin(
    origin: { lat: number; lng: number },
    label: string,
  ) {
    setOriginLabel(label);
    setGeoStatus("granted");
    setRows(sortByDistance(initialRows, origin, { preferInPerson: true }));
  }

  useEffect(() => {
    const lat = Number(initialQuery.lat);
    const lng = Number(initialQuery.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      applyOrigin({ lat, lng }, "coordenadas informadas");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery.lat, initialQuery.lng, initialRows]);

  const subtitle = useMemo(() => {
    if (geoStatus === "granted" && originLabel) {
      return `Ordenado por distância a partir de ${originLabel}. Priorizamos atendimento presencial.`;
    }
    if (geoStatus === "denied") {
      return "Localização negada — use cidade/UF. Atendimento presencial continua em destaque.";
    }
    return "Priorizamos especialistas presenciais. Compartilhe sua localização para ordenar por proximidade (apenas área de serviço aproximada — nunca endereço de cultivo).";
  }, [geoStatus, originLabel]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("prompting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyOrigin(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          "sua localização aproximada",
        );
      },
      () => {
        setGeoStatus("denied");
        setRows(initialRows);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60_000 },
    );
  }

  return (
    <>
      <p className="mt-2 text-sm text-[var(--cwg-text-secondary)]">{subtitle}</p>

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={initialQuery.q ?? ""}
          placeholder="Buscar"
          className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm"
        />
        <input
          name="cidade"
          defaultValue={initialQuery.cidade ?? ""}
          placeholder="Cidade"
          className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm"
        />
        <input
          name="estado"
          defaultValue={initialQuery.estado ?? ""}
          placeholder="UF"
          maxLength={2}
          className="w-20 rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm uppercase"
        />
        <select
          name="mode"
          defaultValue={mode}
          className="rounded-[10px] border border-[var(--cwg-graphite-200)] bg-white px-3 py-2 text-sm"
        >
          <option value="all">Presencial + remoto</option>
          <option value="in_person">Só presencial</option>
          <option value="remote">Só remoto</option>
        </select>
        <button
          type="submit"
          className="rounded-[10px] bg-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={requestLocation}
          data-testid="nearby-geo-button"
          className="rounded-[10px] border border-[var(--cwg-green)] px-4 py-2 text-sm font-semibold text-[var(--cwg-green-deep)]"
        >
          {geoStatus === "prompting"
            ? "Obtendo localização…"
            : "Especialistas perto de mim"}
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--cwg-text-secondary)]">
          Nenhum especialista encontrado.
        </p>
      ) : (
        <ul className="mt-8 space-y-4" data-testid="nearby-results">
          {rows.map((row) => {
            const users = row.users;
            const slug = String(row.slug);
            const modeLabel = [
              row.offers_in_person ? "Presencial" : null,
              row.offers_remote ? "Remoto" : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={String(row.id)}
                className="border-b border-[var(--cwg-graphite-100)] pb-4"
              >
                <Link
                  href={`/tecnicos/${slug}`}
                  className="font-semibold text-[var(--cwg-graphite-900)] hover:text-[var(--cwg-green)]"
                >
                  {users?.full_name || slug}
                </Link>
                <p className="mt-1 text-sm text-[var(--cwg-text-secondary)]">
                  {[row.headline, row.city, row.state].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-[var(--cwg-graphite-500)]">
                  {modeLabel}
                  {row.distance_km != null
                    ? ` · ${formatDistanceKm(row.distance_km)}`
                    : ""}
                  {" · "}
                  {String(row.verification_status)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
