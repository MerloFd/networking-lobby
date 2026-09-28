"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, initialsOf } from "@/components/ui";
import { AREAS, type Area } from "@/lib/domain";
import { areaChip, areaSolid } from "@/lib/style";

type Person = {
  handle: string;
  name: string;
  areas: Area[];
  years: string;
  bio?: string;
};

export default function LobbyList({
  slug,
  people,
}: {
  slug: string;
  people: Person[];
}) {
  const STORE = `node:connected:${slug}`;
  const [filter, setFilter] = useState<Area | null>(null);
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // O progresso mora no aparelho: sem login, e privado por natureza.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setConnected(new Set(JSON.parse(raw)));
    } catch {}
    setHydrated(true);
  }, []);

  function toggle(handle: string) {
    setConnected((prev) => {
      const next = new Set(prev);
      next.has(handle) ? next.delete(handle) : next.add(handle);
      try {
        localStorage.setItem(STORE, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  // Uma pessoa com 3 áreas conta nas 3: o filtro é "quem atua em", não "quem é".
  const areas = useMemo(() => {
    const counts = new Map<Area, number>();
    for (const p of people)
      for (const a of p.areas) counts.set(a, (counts.get(a) ?? 0) + 1);
    return AREAS.filter((a) => counts.has(a))
      .map((a) => [a, counts.get(a)!] as const)
      .sort((x, y) => y[1] - x[1]);
  }, [people]);

  const list = filter
    ? people.filter((p) => p.areas.includes(filter))
    : people;

  const total = people.length;
  const doneCount = connected.size;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <>
      {/* Progresso: transforma a lista em tarefa que dá para terminar */}
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto max-w-2xl px-5 py-3.5">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-muted">
              <strong className="font-semibold text-fg">{total} pessoas</strong> no evento
            </span>
            {hydrated && doneCount > 0 && (
              <span className="font-semibold text-good">
                conectei com {doneCount} de {total}
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-good transition-[width] duration-500"
              style={{ width: `${hydrated ? pct : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filtro por área. Rola na horizontal só aqui, nunca a página. */}
      <div className="sticky top-[89px] z-10 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setFilter(null)}
              aria-pressed={!filter}
              className={`press shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-medium whitespace-nowrap ${
                !filter
                  ? "border-transparent bg-fg text-ink"
                  : "border-line bg-surface text-muted"
              }`}
            >
              Todos
            </button>
            {areas.map(([area, n]) => {
              const on = filter === area;
              return (
                <button
                  key={area}
                  onClick={() => setFilter(on ? null : area)}
                  aria-pressed={on}
                  style={on ? areaSolid(area) : areaChip(area)}
                  className={`press shrink-0 rounded-full border px-3.5 py-2 text-[13px] whitespace-nowrap ${
                    on ? "font-semibold" : "opacity-85"
                  }`}
                >
                  {area} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-1">
        <ul>
          {list.map((p, i) => (
            <Row
              key={p.handle}
              p={p}
              index={i}
              done={hydrated && connected.has(p.handle)}
              onToggle={() => toggle(p.handle)}
            />
          ))}
        </ul>

        <p className="mt-8 text-center text-[13px] leading-relaxed text-muted">
          O LinkedIn não permite enviar convites em lote, nem por API.
          <br />
          Cada toque abre o perfil no app, já com o botão Conectar na tela.
        </p>
      </main>
    </>
  );
}

function Row({
  p,
  index,
  done,
  onToggle,
}: {
  p: Person;
  index: number;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className="rise flex items-center gap-3.5 border-b border-line py-3.5"
      style={{ animationDelay: `${Math.min(index, 12) * 26}ms` }}
    >
      <div className="relative shrink-0">
        <Avatar initials={initialsOf(p.name)} seed={p.handle} />
        {done && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-good text-[10px] font-bold text-ink">
            ✓
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${done ? "text-muted" : "text-fg"}`}>
          {p.name}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
          {p.areas.map((a) => (
            <span
              key={a}
              className="rounded border px-1.5 py-0.5 text-[11px] font-semibold"
              style={areaChip(a)}
            >
              {a}
            </span>
          ))}
          <span>{p.years} anos</span>
        </p>
        {p.bio && <p className="mt-1 truncate text-[13px] text-muted/75">{p.bio}</p>}
      </div>

      <a
        href={`https://www.linkedin.com/in/${p.handle}`}
        target="_blank"
        rel="noreferrer"
        onClick={onToggle}
        className={`press grid h-11 shrink-0 place-items-center rounded-xl px-4 text-[13px] font-semibold transition-colors ${
          done ? "bg-raised text-good" : "bg-good text-ink"
        }`}
      >
        {done ? "Conectado" : "Conectar"}
      </a>
    </li>
  );
}
