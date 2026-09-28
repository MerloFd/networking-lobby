"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { joinEvent } from "@/app/actions";
import { AREAS, MAX_AREAS, SENIORITY, type Area, type Seniority } from "@/lib/domain";
import { guessName, normalizeHandle } from "@/lib/handle";
import { areaChip, areaSolid } from "@/lib/style";

const label = "mb-1.5 block text-[13px] font-medium text-muted";
const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-fg outline-none placeholder:text-muted/50 focus:border-accent";

export default function JoinForm({
  slug,
  raffleOpen,
}: {
  slug: string;
  raffleOpen: boolean;
}) {
  const [handleRaw, setHandleRaw] = useState("");
  const [nameEdited, setNameEdited] = useState<string | null>(null);
  const [years, setYears] = useState<Seniority | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [bioOpen, setBioOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [code, setCode] = useState("");
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [role, setRole] = useState("");
  const [talkTitle, setTalkTitle] = useState("");
  const [links, setLinks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; speaker: boolean } | null>(null);
  const [pending, start] = useTransition();

  const parsed = useMemo(() => normalizeHandle(handleRaw), [handleRaw]);
  const handle = parsed.ok ? parsed.handle : "";
  const name = nameEdited ?? (handle ? guessName(handle) : "");
  const ready = Boolean(parsed.ok && name.trim().length > 2 && years && areas.length);

  function toggleArea(a: Area) {
    setAreas((p) =>
      p.includes(a) ? p.filter((x) => x !== a) : p.length >= MAX_AREAS ? p : [...p, a],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await joinEvent({
        slug,
        handle: handleRaw,
        name,
        years,
        areas,
        bio: bio || undefined,
        code: code || undefined,
        isSpeaker,
        role: role || undefined,
        talkTitle: talkTitle || undefined,
        links: links || undefined,
      });
      if (r.ok) setDone({ name, speaker: isSpeaker });
      else setError(r.error);
    });
  }

  if (done)
    return (
      <Success
        slug={slug}
        name={done.name}
        area={areas[0] ?? "Outro"}
        speaker={done.speaker}
      />
    );

  const full = areas.length >= MAX_AREAS;

  return (
    <form className="relative z-10 mt-6 space-y-5" onSubmit={submit}>
      {/* 1. o único campo de texto obrigatório */}
      <div>
        <label htmlFor="handle" className={label}>
          Seu LinkedIn
        </label>
        <div className="flex items-stretch rounded-xl border border-line bg-surface focus-within:border-accent">
          <span className="grid shrink-0 place-items-center pl-3.5 text-[15px] text-muted">
            linkedin.com/in/
          </span>
          <input
            id="handle"
            value={handleRaw}
            onChange={(e) => setHandleRaw(e.target.value)}
            placeholder="seu-perfil"
            autoComplete="url"
            inputMode="url"
            autoCapitalize="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-3 pl-0.5 pr-3.5 outline-none placeholder:text-muted/50"
          />
        </div>
        <a
          href="https://www.linkedin.com/in/me/"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-[13px] font-medium text-accent"
        >
          Não sei meu link, abrir meu perfil ↗
        </a>
      </div>

      {/* 2. nome, pré-preenchido a partir do handle */}
      <div>
        <label htmlFor="name" className={label}>
          Nome
          {name && nameEdited === null && (
            <span className="font-normal text-muted/70"> · veio do seu link</span>
          )}
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setNameEdited(e.target.value)}
          placeholder="Como quer aparecer na lista"
          autoComplete="name"
          className={field}
        />
      </div>

      {/* 3. um toque */}
      <fieldset>
        <legend className={label}>Anos de carreira</legend>
        <div className="grid grid-cols-4 gap-2">
          {SENIORITY.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setYears(s)}
              aria-pressed={years === s}
              className={`press rounded-xl border py-3.5 text-[15px] font-medium transition-colors ${
                years === s
                  ? "border-accent/50 bg-accent text-white"
                  : "border-line bg-surface text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      {/* 4. toques. Substitui a descrição do perfil sem abrir teclado. */}
      <fieldset>
        <legend className={label}>
          Onde você atua
          <span className="font-normal text-muted/70">
            {areas.length === 0 ? ` · até ${MAX_AREAS}` : ` · ${areas.length} de ${MAX_AREAS}`}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => {
            const on = areas.includes(a);
            const blocked = full && !on;
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleArea(a)}
                aria-pressed={on}
                disabled={blocked}
                style={on ? areaSolid(a) : areaChip(a)}
                className={`press rounded-full border px-4 py-2.5 text-[15px] transition-all ${
                  on ? "font-semibold" : blocked ? "opacity-30" : "opacity-80"
                }`}
              >
                {on && <span className="mr-1">✓</span>}
                {a}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 5. opcional e fechado: ninguém é obrigado a ver isso */}
      {!bioOpen ? (
        <button
          type="button"
          onClick={() => setBioOpen(true)}
          className="text-[13px] font-medium text-muted underline decoration-line underline-offset-4"
        >
          + Adicionar uma linha sobre você (opcional)
        </button>
      ) : (
        <div className="pop">
          <label htmlFor="bio" className={label}>
            Uma linha sobre você
            <span className="font-normal text-muted/70"> · {80 - bio.length} restantes</span>
          </label>
          <input
            id="bio"
            value={bio}
            maxLength={80}
            onChange={(e) => setBio(e.target.value)}
            placeholder="No que você trabalha, o que procura…"
            className={field}
          />
        </div>
      )}

      {/*
        6. O mesmo formulário serve ao palestrante. Ele marca aqui, preenche dois
        campos a mais, e o organizador só aprova. Ninguém digita a lista de
        palestrantes à mão.
      */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          type="button"
          onClick={() => setIsSpeaker((v) => !v)}
          aria-pressed={isSpeaker}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[13px] font-bold transition-colors ${
              isSpeaker
                ? "border-accent bg-accent text-white"
                : "border-line bg-ink text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold">Sou palestrante</span>
            <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
              Seu card vai para a aba Palestrantes depois que o organizador aprovar.
            </span>
          </span>
        </button>

        {isSpeaker && (
          <div className="pop space-y-2 border-t border-line p-4">
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Cargo e empresa"
              maxLength={80}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 outline-none placeholder:text-muted/50 focus:border-accent"
            />
            <input
              value={talkTitle}
              onChange={(e) => setTalkTitle(e.target.value)}
              placeholder="Título da sua talk"
              maxLength={120}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 outline-none placeholder:text-muted/50 focus:border-accent"
            />
            <input
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Outros links, separados por espaço"
              maxLength={400}
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 outline-none placeholder:text-muted/50 focus:border-accent"
            />
            <p className="text-[13px] leading-relaxed text-muted">
              Cole GitHub, blog, slides, o que quiser. O nome de cada botão sai do
              próprio endereço.
            </p>
          </div>
        )}
      </div>

      {raffleOpen && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-start gap-3 bg-gradient-to-br from-accent-2/12 to-transparent p-4">
            <span className="mt-0.5 text-lg">🎁</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Concorrer ao sorteio</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Digite o código que está no telão. É opcional, sem ele você entra no
                lobby normalmente.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="K7QX"
                autoCapitalize="characters"
                maxLength={4}
                className="mt-3 w-32 rounded-xl border border-line bg-ink px-3.5 py-3 text-center text-xl font-semibold tracking-[0.3em] outline-none focus:border-accent-2"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="pop rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed text-red-300">
          {error}
        </p>
      )}

      {/* Barra fixa: o botão nunca sai da tela */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl">
          <button
            type="submit"
            disabled={!ready || pending}
            className={`press w-full rounded-xl py-4 font-semibold transition-colors ${
              ready && !pending ? "bg-accent text-white" : "bg-raised text-muted"
            }`}
          >
            {pending ? "Entrando…" : "Entrar no lobby"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Success({
  slug,
  name,
  area,
  speaker,
}: {
  slug: string;
  name: string;
  area: Area;
  speaker: boolean;
}) {
  return (
    <div className="relative z-10 mt-12 text-center">
      <div className="relative mx-auto h-20 w-20">
        <span
          className="ring absolute inset-0 rounded-full border-2"
          style={{ borderColor: areaChip(area).color }}
        />
        <div
          className="pop absolute inset-0 grid place-items-center rounded-full text-3xl font-bold"
          style={areaSolid(area)}
        >
          ✓
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        Boa, {name.split(" ")[0]}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
        Você está na lista. Guardamos seu perfil nesse aparelho, então no próximo
        evento da comunidade é um toque para entrar.
      </p>
      {speaker && (
        <p className="mx-auto mt-3 max-w-sm rounded-xl border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted">
          Seu pedido de palestrante foi enviado. Assim que o organizador aprovar, seu
          card aparece na aba Palestrantes.
        </p>
      )}
      <Link
        href={`/e/${slug}/lobby`}
        className="press mt-7 inline-block w-full rounded-xl bg-accent py-4 font-semibold text-white"
      >
        Ver quem está no evento
      </Link>
    </div>
  );
}
