"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  confirmWinner, decideSpeaker, drawWinner, removeParticipant, rotateCode,
  setEventState, type DrawOutcome,
} from "@/app/actions";
import { Avatar, initialsOf } from "@/components/ui";
import { STATE_HINT } from "@/lib/domain";

type State = keyof typeof STATE_HINT;

type Props = {
  ev: {
    slug: string;
    name: string;
    state: State;
    presenceCode: string | null;
    raffleRound: number;
  };
  signups: number;
  poolSize: number;
  people: { id: string; name: string; handle: string; present: boolean }[];
  pending: {
    id: string; name: string; handle: string; role: string | null;
    talkTitle: string | null; links: { label: string; url: string }[];
  }[];
  approved: { id: string; name: string; talkTitle: string | null; links: number }[];
  rounds: {
    round: number; seed: string; poolSize: number; prize: string | null;
    winnerName: string | null; winnerHandle: string | null;
  }[];
};

export default function AdminPanel({
  ev, signups, poolSize, people, pending, approved, rounds,
}: Props) {
  const [prize, setPrize] = useState("");
  const [rolling, setRolling] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<DrawOutcome, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, start] = useTransition();

  function runDraw() {
    setError(null);
    start(async () => {
      const r = await drawWinner(ev.slug);
      if (!r.ok) return setError(r.error);

      // Anima embaralhando nomes, mas o ganhador já veio decidido pela seed.
      const nomes = people.filter((p) => p.present).map((p) => p.name);
      let ticks = 0;
      const id = setInterval(() => {
        setRolling(nomes[Math.floor(Math.random() * nomes.length)] ?? "");
        if (++ticks > 14) {
          clearInterval(id);
          setRolling(null);
          setResult(r);
        }
      }, 90);
    });
  }

  return (
    <div className="aurora">
      <div className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-6">
        <Link href="/admin" className="text-[13px] font-medium text-muted">
          ‹ Seus eventos
        </Link>

        <div className="mt-3 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight">
            {ev.name}
          </h1>
          <Link
            href={`/e/${ev.slug}/telao`}
            className="press shrink-0 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] font-semibold"
          >
            Telão ↗
          </Link>
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-gradient-to-br from-accent/10 to-transparent p-4">
            <p className="text-[13px] text-muted">No lobby</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{signups}</p>
          </div>
          <div className="rounded-2xl border border-line bg-gradient-to-br from-good/10 to-transparent p-4">
            <p className="flex items-center gap-1.5 text-[13px] text-muted">
              <span className="breathe inline-block h-1.5 w-1.5 rounded-full bg-good" />
              Concorrendo
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-good">
              {poolSize}
            </p>
          </div>
        </section>

        <Section title="Estado do evento">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATE_HINT) as State[]).map((s) => (
              <button
                key={s}
                onClick={() => start(() => setEventState(ev.slug, s).then(() => {}))}
                aria-pressed={ev.state === s}
                disabled={busy}
                className={`press rounded-xl border px-3 py-3 text-left text-[15px] capitalize transition-colors ${
                  ev.state === s
                    ? "border-accent/50 bg-accent font-semibold text-white"
                    : "border-line bg-surface font-medium text-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {STATE_HINT[ev.state]}
          </p>
        </Section>

        <Section title="Código de presença">
          <div className="flex items-center justify-between rounded-2xl border border-line bg-gradient-to-r from-accent-2/10 to-transparent p-4">
            <div>
              <p className="font-mono text-4xl font-bold tracking-[0.2em] text-accent-2">
                {ev.presenceCode ?? "····"}
              </p>
              <p className="mt-1.5 text-[13px] text-muted">
                {ev.presenceCode
                  ? "Quem digitar esse código concorre"
                  : "Gere o código para abrir o sorteio"}
              </p>
            </div>
            <button
              onClick={() => start(() => rotateCode(ev.slug).then(() => {}))}
              disabled={busy}
              className="press rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[13px] font-semibold"
            >
              {ev.presenceCode ? "Trocar" : "Gerar"}
            </button>
          </div>
        </Section>

        <Section title={`Sorteio · rodada ${ev.raffleRound}`}>
          <input
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="O que está sendo sorteado (opcional)"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 outline-none placeholder:text-muted/50 focus:border-accent"
          />

          <button
            onClick={runDraw}
            disabled={busy || !!rolling || !!result || !poolSize}
            className="press mt-2 w-full rounded-xl bg-accent py-4 font-semibold text-white disabled:bg-raised disabled:text-muted"
          >
            {rolling
              ? "Sorteando…"
              : !poolSize
                ? "Ninguém concorrendo ainda"
                : `Sortear entre ${poolSize} presentes`}
          </button>

          {rolling && <p className="mt-4 text-center text-2xl font-semibold">{rolling}</p>}

          {error && (
            <p className="pop mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
              {error}
            </p>
          )}

          {result && (
            <div className="pop mt-4 rounded-2xl border border-good/30 bg-good/8 p-4 text-center">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-good">
                Ganhador
              </p>
              <p className="mt-1.5 text-2xl font-semibold">{result.winner.name}</p>
              <p className="font-mono text-[13px] text-muted">/in/{result.winner.handle}</p>

              <div className="mt-4 rounded-xl bg-ink/60 p-3 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Prova
                </p>
                <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-fg/70">
                  seed {result.seed}
                  <br />
                  pool {result.poolSize} · rodada {result.round}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">
                  Mesma seed e mesma lista sempre dão o mesmo nome. Qualquer pessoa
                  reconfere sem confiar em você.
                </p>
              </div>

              {result.backups.length > 0 && (
                <p className="mt-3 text-[13px] text-muted">
                  Se já foi embora, os próximos são{" "}
                  <strong className="font-semibold text-fg">
                    {result.backups.map((b) => b.split(" ")[0]).join(", ")}
                  </strong>
                </p>
              )}

              <button
                onClick={() =>
                  start(async () => {
                    const r = await confirmWinner(ev.slug, result.winner.id, prize);
                    if (!r.ok) setError(r.error);
                    else {
                      setResult(null);
                      setPrize("");
                    }
                  })
                }
                disabled={busy}
                className="press mt-4 w-full rounded-xl bg-good py-3.5 font-semibold text-ink"
              >
                Confirmar e liberar próxima rodada
              </button>
            </div>
          )}

          {rounds.length > 0 && (
            <ul className="mt-4 space-y-2">
              {rounds.map((r) => (
                <li
                  key={r.round}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
                >
                  <span className="text-lg">🏆</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.winnerName ?? "removido"}</p>
                    <p className="truncate text-[13px] text-muted">
                      {r.prize ?? `Rodada ${r.round}`}
                    </p>
                    <p className="truncate font-mono text-[11px] text-muted/70">
                      {r.seed} · pool {r.poolSize}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Pedidos de palestra: o participante preenche, você só decide */}
        {pending.length > 0 && (
          <Section title={`Pedidos de palestrante (${pending.length})`}>
            <ul className="space-y-2">
              {pending.map((p) => (
                <li key={p.id} className="rounded-2xl border border-accent/30 bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={initialsOf(p.name)} seed={p.handle} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.role && (
                        <p className="truncate text-[13px] text-muted">{p.role}</p>
                      )}
                    </div>
                  </div>
                  {p.talkTitle && (
                    <p className="mt-3 border-l-2 border-accent pl-3 text-[15px] leading-snug">
                      {p.talkTitle}
                    </p>
                  )}
                  <p className="mt-2 truncate font-mono text-[11px] text-muted">
                    /in/{p.handle}
                    {p.links.length > 0 && ` · ${p.links.length} links`}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        start(() => decideSpeaker(ev.slug, p.id, "aprovado").then(() => {}))
                      }
                      disabled={busy}
                      className="press rounded-xl bg-good py-3 text-[15px] font-semibold text-ink"
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() =>
                        start(() => decideSpeaker(ev.slug, p.id, "recusado").then(() => {}))
                      }
                      disabled={busy}
                      className="press rounded-xl border border-line bg-raised py-3 text-[15px] font-semibold text-muted"
                    >
                      Recusar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={`Palestrantes no ar (${approved.length})`}>
          {approved.length === 0 ? (
            <p className="rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
              Ninguém aprovado ainda. Quem vai palestrar marca "Sou palestrante" no
              mesmo formulário do lobby, e aparece aqui para você aprovar. Você não
              digita nada.
            </p>
          ) : (
            <ul className="space-y-2">
              {approved.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <Avatar initials={initialsOf(s.name)} seed={s.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{s.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {s.links} links{s.talkTitle ? ` · ${s.talkTitle}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Divulgação">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="grid h-40 place-items-center rounded-xl bg-raised text-[13px] text-muted">
              [ QR code do evento ]
            </div>
            <button
              onClick={() => {
                navigator.clipboard
                  ?.writeText(`${location.origin}/e/${ev.slug}`)
                  .catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              className={`press mt-3 w-full rounded-xl border py-3.5 text-[15px] font-semibold ${
                copied ? "border-good/40 bg-good/10 text-good" : "border-line bg-raised"
              }`}
            >
              {copied ? "Link copiado" : `Copiar /e/${ev.slug}`}
            </button>
          </div>
        </Section>

        <Section title={`Inscritos (${signups})`}>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">{p.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted">
                    /in/{p.handle}
                  </p>
                </div>
                {p.present ? (
                  <span className="shrink-0 rounded bg-good/15 px-1.5 py-0.5 text-[11px] font-semibold text-good">
                    presente
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-raised px-1.5 py-0.5 text-[11px] text-muted">
                    sem código
                  </span>
                )}
                <button
                  onClick={() =>
                    start(() => removeParticipant(ev.slug, p.id).then(() => {}))
                  }
                  disabled={busy}
                  className="shrink-0 text-[13px] font-medium text-muted"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
            Duplicados já são barrados pelo handle do LinkedIn. Quem não digitou o
            código entra no lobby mas fica fora do sorteio.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
