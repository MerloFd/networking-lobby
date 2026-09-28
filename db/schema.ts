import {
  boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp,
  uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

export const eventState = pgEnum("event_state", [
  "rascunho", "aberto", "sorteio", "encerrado",
]);

export const speakerStatus = pgEnum("speaker_status", [
  "nenhum", "pendente", "aprovado", "recusado",
]);

export const organizers = pgTable("organizers", {
  id: uuid("id").primaryKey().defaultRandom(),
  githubId: text("github_id").unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: uuid("organizer_id").notNull().references(() => organizers.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** Data do evento. Sem hora: o organizador não precisa disso. */
    happensOn: text("happens_on").notNull(),
    venue: text("venue"),
    state: eventState("state").notNull().default("rascunho"),
    /** Código de presença atual, trocado a cada rotação. */
    presenceCode: text("presence_code"),
    presenceCodeAt: timestamp("presence_code_at", { withTimezone: true }),
    /** Próxima rodada de sorteio. Cresce a cada ganhador confirmado. */
    raffleRound: integer("raffle_round").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("events_slug_idx").on(t.slug)],
);

/**
 * Uma tabela só para participante e palestrante.
 * Palestrante é um participante com `speakerStatus` diferente de "nenhum": o
 * mesmo formulário serve aos dois, e o organizador só aprova ou recusa.
 */
export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    /** Handle do LinkedIn já normalizado. É a chave natural contra duplicado. */
    handle: text("handle").notNull(),
    name: text("name").notNull(),
    years: text("years").notNull(),
    areas: text("areas").array().notNull(),
    bio: text("bio"),
    /** Digitou o código do telão, então concorre ao sorteio. */
    present: boolean("present").notNull().default(false),

    speakerStatus: speakerStatus("speaker_status").notNull().default("nenhum"),
    /** Preenchidos só por quem marcou "sou palestrante". */
    talkTitle: text("talk_title"),
    role: text("role"),
    links: jsonb("links").$type<{ label: string; url: string }[]>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // A regra que mata duplicado: uma inscrição por perfil por evento.
    uniqueIndex("participants_event_handle_idx").on(t.eventId, t.handle),
    index("participants_event_idx").on(t.eventId),
  ],
);

/**
 * Histórico de sorteios. Guarda a prova, não só o ganhador: com seed e tamanho
 * do pool qualquer pessoa reconfere o resultado meses depois.
 */
export const raffleRounds = pgTable(
  "raffle_rounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    seed: text("seed").notNull(),
    poolSize: integer("pool_size").notNull(),
    /** Ordem completa sorteada, para auditoria e para os suplentes. */
    orderedHandles: text("ordered_handles").array().notNull(),
    winnerId: uuid("winner_id").references(() => participants.id, { onDelete: "set null" }),
    prize: text("prize"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("raffle_event_round_idx").on(t.eventId, t.round)],
);

export type Event = typeof events.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type RaffleRound = typeof raffleRounds.$inferSelect;
