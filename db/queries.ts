import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, dbReady } from "./index";
import { events, organizers, participants, raffleRounds } from "./schema";

export async function getEventBySlug(slug: string) {
  await dbReady;
  const [ev] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return ev ?? null;
}

export async function listParticipants(eventId: string) {
  await dbReady;
  return db
    .select()
    .from(participants)
    .where(eq(participants.eventId, eventId))
    .orderBy(asc(participants.createdAt));
}

/** Palestrantes aprovados, que é o que a aba pública mostra. */
export async function listSpeakers(eventId: string) {
  await dbReady;
  return db
    .select()
    .from(participants)
    .where(and(eq(participants.eventId, eventId), eq(participants.speakerStatus, "aprovado")))
    .orderBy(asc(participants.createdAt));
}

export async function listSpeakerRequests(eventId: string) {
  await dbReady;
  return db
    .select()
    .from(participants)
    .where(and(eq(participants.eventId, eventId), eq(participants.speakerStatus, "pendente")))
    .orderBy(asc(participants.createdAt));
}

/** Concorrentes: presentes que ainda não ganharam nada. Ordem de inscrição. */
export async function rafflePool(eventId: string) {
  await dbReady;
  const won = db
    .select({ id: raffleRounds.winnerId })
    .from(raffleRounds)
    .where(eq(raffleRounds.eventId, eventId));

  return db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.eventId, eventId),
        eq(participants.present, true),
        sql`${participants.id} not in (select coalesce(winner_id, '00000000-0000-0000-0000-000000000000'::uuid) from ${raffleRounds} where event_id = ${eventId})`,
      ),
    )
    .orderBy(asc(participants.createdAt));
}

export async function listRounds(eventId: string) {
  await dbReady;
  return db
    .select({
      round: raffleRounds.round,
      seed: raffleRounds.seed,
      poolSize: raffleRounds.poolSize,
      prize: raffleRounds.prize,
      winnerName: participants.name,
      winnerHandle: participants.handle,
    })
    .from(raffleRounds)
    .leftJoin(participants, eq(raffleRounds.winnerId, participants.id))
    .where(eq(raffleRounds.eventId, eventId))
    .orderBy(asc(raffleRounds.round));
}

export async function listEventsOf(organizerId: string) {
  await dbReady;
  const rows = await db
    .select({
      slug: events.slug,
      name: events.name,
      happensOn: events.happensOn,
      state: events.state,
      signups: sql<number>`count(${participants.id})::int`,
    })
    .from(events)
    .leftJoin(participants, eq(participants.eventId, events.id))
    .where(eq(events.organizerId, organizerId))
    .groupBy(events.id)
    .orderBy(desc(events.happensOn));
  return rows;
}

/** Enquanto não existe login, o primeiro organizador é o dono de tudo. */
export async function currentOrganizer() {
  await dbReady;
  const [org] = await db.select().from(organizers).limit(1);
  return org ?? null;
}
