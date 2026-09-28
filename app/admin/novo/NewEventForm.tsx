"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createEvent } from "@/app/actions";
import { slugify } from "@/lib/slug";

const label = "mb-1.5 block text-[13px] font-medium text-muted";
const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-fg outline-none placeholder:text-muted/50 focus:border-accent";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/**
 * Sugestão de nome e data já preenchidas. O organizador já cadastrou o evento na
 * Sympla e não quer digitar tudo de novo, então o caminho rápido é aceitar os
 * defaults e tocar em Criar. Tudo aqui é editável depois.
 */
function defaults() {
  const now = new Date();
  return {
    name: `Meetup Dev de ${MESES[now.getMonth()]}`,
    date: now.toISOString().slice(0, 10),
  };
}

export default function NewEventForm({
  lastEvent,
}: {
  lastEvent?: { name: string; venue: string | null };
}) {
  const d = defaults();
  const [name, setName] = useState(lastEvent ? nextName(lastEvent.name) : d.name);
  const [date, setDate] = useState(d.date);
  const [venue, setVenue] = useState(lastEvent?.venue ?? "");
  const [slugEdited, setSlugEdited] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const slug = slugEdited ?? slugify(name);
  const ready = name.trim().length > 2 && Boolean(date);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await createEvent({ name, happensOn: date, venue: venue || undefined });
      if (r.ok && r.slug) setCreated(r.slug);
      else if (!r.ok) setError(r.error);
    });
  }

  if (created) return <Created slug={created} name={name} />;

  return (
    <main className="relative z-10 mx-auto max-w-2xl px-5 pb-32 pt-6">
      <Link href="/admin" className="text-[13px] font-medium text-muted">
        ‹ Seus eventos
      </Link>
      <h1 className="ink-grad mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight">
        Criar evento
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Já vem preenchido. Se estiver certo, é só tocar em criar. Palestrantes se
        cadastram sozinhos depois.
      </p>

      <form className="mt-6 space-y-5" onSubmit={submit}>
        <div>
          <label htmlFor="name" className={label}>
            Nome do evento
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={field}
          />
        </div>

        <div>
          <label htmlFor="date" className={label}>
            Data
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={field}
          />
        </div>

        {!more ? (
          <button
            type="button"
            onClick={() => setMore(true)}
            className="text-[13px] font-medium text-muted underline decoration-line underline-offset-4"
          >
            + Local e endereço do link (opcional)
          </button>
        ) : (
          <div className="pop space-y-5">
            <div>
              <label htmlFor="venue" className={label}>
                Local
              </label>
              <input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditório"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="slug" className={label}>
                Endereço
                {slugEdited === null && (
                  <span className="font-normal text-muted/70"> · gerado do nome</span>
                )}
              </label>
              <div className="flex items-stretch rounded-xl border border-line bg-surface focus-within:border-accent">
                <span className="grid shrink-0 place-items-center pl-3.5 text-[15px] text-muted">
                  /e/
                </span>
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlugEdited(slugify(e.target.value))}
                  autoCapitalize="off"
                  spellCheck={false}
                  className="min-w-0 flex-1 bg-transparent py-3 pl-0.5 pr-3.5 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="pop rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            {error}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl">
            <button
              type="submit"
              disabled={!ready || pending}
              className={`press w-full rounded-xl py-4 font-semibold transition-colors ${
                ready && !pending ? "bg-accent text-white" : "bg-raised text-muted"
              }`}
            >
              {pending ? "Criando…" : "Criar evento"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

/** "Meetup Dev de Setembro" vira "Meetup Dev de Outubro" ao duplicar. */
function nextName(prev: string) {
  const i = MESES.findIndex((m) => prev.toLowerCase().includes(m.toLowerCase()));
  if (i < 0) return prev;
  return prev.replace(new RegExp(MESES[i], "i"), MESES[(i + 1) % 12]);
}

function Created({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${typeof location !== "undefined" ? location.host : ""}/e/${slug}`;
  return (
    <main className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-14 text-center">
      <div className="pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-good text-3xl font-bold text-ink">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{name} criado</h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        Está em rascunho, ninguém consegue se cadastrar ainda. Abra o painel quando o
        evento começar.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <div className="mx-auto grid h-44 w-44 place-items-center rounded-xl bg-raised text-[13px] text-muted">
          [ QR code ]
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className={`press mt-3 w-full truncate rounded-xl border py-3.5 text-[15px] font-semibold ${
            copied ? "border-good/40 bg-good/10 text-good" : "border-line bg-raised"
          }`}
        >
          {copied ? "Link copiado" : `Copiar /e/${slug}`}
        </button>
        <p className="mt-2.5 text-left text-[13px] leading-relaxed text-muted">
          O QR e o link levam ao mesmo lugar. Cole o link no grupo do WhatsApp, e para o
          slide use a tela do telão direto no projetor.
        </p>
      </div>

      <Link
        href={`/e/${slug}/admin`}
        className="press mt-6 inline-block w-full rounded-xl bg-accent py-4 font-semibold text-white"
      >
        Abrir painel do evento
      </Link>
    </main>
  );
}
