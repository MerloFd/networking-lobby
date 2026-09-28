"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, dbReady } from "@/db";
import { events, organizers, participants, raffleRounds } from "@/db/schema";
import { getEventBySlug, rafflePool } from "@/db/queries";
import { AREAS, MAX_AREAS, SENIORITY } from "@/lib/domain";
import { slugify } from "@/lib/slug";
import { HANDLE_ERRORS, normalizeHandle } from "@/lib/handle";
import { draw, seedFor } from "@/lib/raffle";

export type ActionResult =
  | { ok: true; handle?: string; slug?: string }
  | { ok: false; error: string; field?: string };

const joinSchema = z.object({
  slug: z.string().min(1),
  handle: z.string().min(1),
  name: z.string().trim().min(3, "Nome curto demais.").max(80),
  years: z.enum(SENIORITY),
  areas: z.array(z.enum(AREAS)).min(1, "Escolha ao menos uma área.").max(MAX_AREAS),
  bio: z.string().trim().max(80).optional(),
  code: z.string().trim().max(8).optional(),
  isSpeaker: z.boolean().optional(),
  role: z.string().trim().max(80).optional(),
  talkTitle: z.string().trim().max(120).optional(),
  links: z.string().trim().max(400).optional(),
});

/** "GitHub https://... , Blog https://..." ou só URLs soltas. */
function parseLinks(raw?: string) {
  if (!raw) return [];
  return raw
    .split(/[\s,;]+/)
    .filter((t) => /^https?:\/\//i.test(t))
    .slice(0, 6)
    .map((url) => {
      let label = "Link";
      try {
        label = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
        label = label[0].toUpperCase() + label.slice(1);
      } catch {}
      return { label, url };
    });
}

export async function joinEvent(input: unknown): Promise<ActionResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0] ?? "") };
  }
  const d = parsed.data;

  const h = normalizeHandle(d.handle);
  if (!h.ok) return { ok: false, error: HANDLE_ERRORS[h.reason], field: "handle" };

  const ev = await getEventBySlug(d.slug);
  if (!ev) return { ok: false, error: "Evento não encontrado." };
  if (ev.state === "rascunho")
    return { ok: false, error: "O cadastro desse evento ainda não abriu." };
  if (ev.state === "encerrado")
    return { ok: false, error: "O cadastro desse evento já encerrou." };

  // Presença só vale com o código que está no telão naquele momento.
  const present =
    Boolean(d.code) &&
    Boolean(ev.presenceCode) &&
    d.code!.toUpperCase() === ev.presenceCode!.toUpperCase();

  const speaker = d.isSpeaker ? "pendente" : "nenhum";

  try {
    await db
      .insert(participants)
      .values({
        eventId: ev.id,
        handle: h.handle,
        name: d.name,
        years: d.years,
        areas: d.areas,
        bio: d.bio || null,
        present,
        speakerStatus: speaker,
        role: d.isSpeaker ? d.role || null : null,
        talkTitle: d.isSpeaker ? d.talkTitle || null : null,
        links: d.isSpeaker ? parseLinks(d.links) : null,
      })
      // Reentrar atualiza em vez de estourar: a pessoa corrige o próprio card,
      // e quem digitou o código depois passa a concorrer.
      .onConflictDoUpdate({
        target: [participants.eventId, participants.handle],
        set: {
          name: d.name,
          years: d.years,
          areas: d.areas,
          bio: d.bio || null,
          present: sql`${participants.present} or ${present}`,
          speakerStatus: d.isSpeaker ? sql`case when ${participants.speakerStatus} = 'nenhum' then 'pendente' else ${participants.speakerStatus} end` : participants.speakerStatus,
          role: d.isSpeaker ? d.role || null : sql`${participants.role}`,
          talkTitle: d.isSpeaker ? d.talkTitle || null : sql`${participants.talkTitle}`,
          links: d.isSpeaker ? parseLinks(d.links) : sql`${participants.links}`,
        },
      });
  } catch (e) {
    return { ok: false, error: "Não deu para salvar agora. Tente de novo." };
  }

  revalidatePath(`/e/${d.slug}/lobby`);
  revalidatePath(`/e/${d.slug}/admin`);
  return { ok: true, handle: h.handle };
}

const createSchema = z.object({
  name: z.string().trim().min(3, "Dê um nome ao evento.").max(80),
  happensOn: z.string().min(1, "Escolha a data."),
  venue: z.string().trim().max(120).optional(),
});

export async function createEvent(input: unknown): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first.message, field: String(first.path[0] ?? "") };
  }
  await dbReady;

  const [org] = await db
    .insert(organizers)
    .values({ name: "Comunidade Dev Local" })
    .onConflictDoNothing()
    .returning();
  const organizerId =
    org?.id ?? (await db.select().from(organizers).limit(1))[0]?.id;
  if (!organizerId) return { ok: false, error: "Nenhum organizador configurado." };

  // Colisão de endereço é comum em evento recorrente. Resolve sozinho.
  const base = slugify(parsed.data.name) || "evento";
  let slug = base;
  for (let i = 2; await getEventBySlug(slug); i++) slug = `${base}-${i}`;

  await db.insert(events).values({
    organizerId,
    slug,
    name: parsed.data.name,
    happensOn: parsed.data.happensOn,
    venue: parsed.data.venue || null,
  });

  revalidatePath("/admin");
  return { ok: true, slug };
}

export async function setEventState(
  slug: string,
  state: "rascunho" | "aberto" | "sorteio" | "encerrado",
): Promise<ActionResult> {
  await dbReady;
  await db.update(events).set({ state }).where(eq(events.slug, slug));
  revalidatePath(`/e/${slug}/admin`);
  revalidatePath(`/e/${slug}`);
  return { ok: true };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem I, O, 0 e 1

export async function rotateCode(slug: string): Promise<ActionResult> {
  await dbReady;
  const code = Array.from(
    { length: 4 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");
  await db
    .update(events)
    .set({ presenceCode: code, presenceCodeAt: new Date() })
    .where(eq(events.slug, slug));
  revalidatePath(`/e/${slug}/admin`);
  revalidatePath(`/e/${slug}/telao`);
  return { ok: true };
}

export async function decideSpeaker(
  slug: string,
  participantId: string,
  decision: "aprovado" | "recusado",
): Promise<ActionResult> {
  await dbReady;
  const ev = await getEventBySlug(slug);
  if (!ev) return { ok: false, error: "Evento não encontrado." };
  await db
    .update(participants)
    .set({ speakerStatus: decision })
    .where(and(eq(participants.id, participantId), eq(participants.eventId, ev.id)));
  revalidatePath(`/e/${slug}/admin`);
  revalidatePath(`/e/${slug}/palestrantes`);
  return { ok: true };
}

export type DrawOutcome =
  | {
      ok: true;
      winner: { id: string; name: string; handle: string };
      backups: string[];
      seed: string;
      poolSize: number;
      round: number;
    }
  | { ok: false; error: string };

/**
 * Sorteia mas não grava: o organizador confirma depois. Evita queimar rodada
 * por toque acidental no meio da apresentação.
 */
export async function drawWinner(slug: string): Promise<DrawOutcome> {
  const ev = await getEventBySlug(slug);
  if (!ev) return { ok: false, error: "Evento não encontrado." };
  if (!ev.presenceCode)
    return { ok: false, error: "Gere o código de presença antes de sortear." };

  const pool = await rafflePool(ev.id);
  if (!pool.length) return { ok: false, error: "Ninguém concorrendo ainda." };

  const seed = seedFor(ev.presenceCode, ev.raffleRound, ev.slug);
  const { winners, backups, proof } = draw(seed, pool, 1);
  const w = winners[0];

  return {
    ok: true,
    winner: { id: w.id, name: w.name, handle: w.handle },
    backups: backups.map((b) => b.name),
    seed,
    poolSize: proof.poolSize,
    round: ev.raffleRound,
  };
}

export async function confirmWinner(
  slug: string,
  winnerId: string,
  prize: string,
): Promise<ActionResult> {
  const ev = await getEventBySlug(slug);
  if (!ev) return { ok: false, error: "Evento não encontrado." };
  if (!ev.presenceCode) return { ok: false, error: "Sem código de presença." };

  const pool = await rafflePool(ev.id);
  const seed = seedFor(ev.presenceCode, ev.raffleRound, ev.slug);
  const { winners } = draw(seed, pool, 1);

  // Confere que o nome confirmado é o que a seed produz. Se o pool mudou entre
  // sortear e confirmar, o resultado é recusado em vez de gravar algo que não
  // fecha com a prova.
  if (!winners[0] || winners[0].id !== winnerId) {
    return {
      ok: false,
      error: "A lista mudou desde o sorteio. Sorteie de novo para a prova fechar.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.insert(raffleRounds).values({
      eventId: ev.id,
      round: ev.raffleRound,
      seed,
      poolSize: pool.length,
      orderedHandles: draw(seed, pool, pool.length).winners.map((p) => p.handle),
      winnerId,
      prize: prize.trim() || null,
    });
    await tx
      .update(events)
      .set({ raffleRound: ev.raffleRound + 1 })
      .where(eq(events.id, ev.id));
  });

  revalidatePath(`/e/${slug}/admin`);
  return { ok: true };
}

export async function removeParticipant(
  slug: string,
  participantId: string,
): Promise<ActionResult> {
  await dbReady;
  const ev = await getEventBySlug(slug);
  if (!ev) return { ok: false, error: "Evento não encontrado." };
  await db
    .delete(participants)
    .where(and(eq(participants.id, participantId), eq(participants.eventId, ev.id)));
  revalidatePath(`/e/${slug}/admin`);
  revalidatePath(`/e/${slug}/lobby`);
  return { ok: true };
}
