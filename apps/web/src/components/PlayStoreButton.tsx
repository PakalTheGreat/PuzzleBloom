import { DEFAULT_PLAY_STORE_URL } from "@cwg/shared";

type Props = {
  className?: string;
  variant?: "light" | "dark" | "accent";
};

export function getPlayStoreUrl() {
  return (
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || DEFAULT_PLAY_STORE_URL
  );
}

export function PlayStoreButton({ className = "", variant = "accent" }: Props) {
  const href = getPlayStoreUrl();
  const styles =
    variant === "light"
      ? "border border-white/30 bg-white/10 text-white hover:bg-white/20"
      : variant === "dark"
        ? "border border-[var(--cwg-graphite-200)] bg-[var(--cwg-graphite-900)] text-white hover:bg-black"
        : "bg-[var(--cwg-accent)] text-[var(--cwg-graphite-950)] hover:brightness-110";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="play-store-button"
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-semibold transition ${styles} ${className}`}
    >
      <PlayIcon />
      Baixar na Google Play
    </a>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M3.6 2.5a1 1 0 0 0-.6.9v17.2a1 1 0 0 0 1.5.9l14.8-8.6a1 1 0 0 0 0-1.7L4.5 2.6a1 1 0 0 0-.9-.1z" />
    </svg>
  );
}
