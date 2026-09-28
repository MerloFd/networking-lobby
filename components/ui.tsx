import Link from "next/link";
import { avatarStyle } from "@/lib/style";

export function Avatar({
  initials,
  seed,
  size = 42,
}: {
  initials: string;
  seed?: string;
  size?: number;
}) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.34, ...avatarStyle(seed ?? initials) }}
    >
      {initials}
    </div>
  );
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}

export function Logo() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-[10px] font-bold text-white">
      n
    </span>
  );
}

/** Cabeçalho e abas. É a única navegação do site: entrar, lobby, palestrantes. */
export function EventChrome({
  slug,
  name,
  tab,
}: {
  slug: string;
  name: string;
  tab: "entrar" | "lobby" | "palestrantes";
}) {
  const base = `/e/${slug}`;
  const tabs = [
    { key: "entrar", label: "Entrar", href: base },
    { key: "lobby", label: "Lobby", href: `${base}/lobby` },
    { key: "palestrantes", label: "Palestrantes", href: `${base}/palestrantes` },
  ] as const;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl px-5 pt-4">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="truncate text-[13px] text-muted">{name}</span>
        </div>
        <nav className="-mx-1 mt-3 flex gap-1" aria-label="Seções do evento">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              aria-current={tab === t.key ? "page" : undefined}
              className={`relative rounded-t-md px-3 py-2.5 text-sm transition-colors ${
                tab === t.key ? "font-semibold text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-accent to-accent-2" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export function formatShort(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}
