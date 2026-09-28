import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Dois alvos, um só dialeto.
 *
 * Em produção, Neon. Em desenvolvimento, PGlite: é o próprio Postgres compilado
 * para WASM, rodando dentro do processo do Next. Isso significa Postgres de
 * verdade no Windows sem Docker, sem serviço para subir e sem string de conexão,
 * e o mesmo SQL que vai rodar em produção. O preço é que os dados moram em
 * `.pglite/` e dá para apagar a pasta quando quiser recomeçar.
 */

type DB =
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzleNeon<typeof schema>>;

// O dev server do Next recarrega módulos a cada edição. Sem o singleton global,
// cada reload abriria outra instância do PGlite sobre a mesma pasta.
const g = globalThis as unknown as { __db?: DB; __dbReady?: Promise<void> };

function migrationSql() {
  const dir = path.join(process.cwd(), "db", "migrations");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => fs.readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

function build(): { db: DB; ready: Promise<void> } {
  const url = process.env.DATABASE_URL;

  if (url) {
    return { db: drizzleNeon(url, { schema }), ready: Promise.resolve() };
  }

  const client = new PGlite(path.join(process.cwd(), ".pglite"));
  const db = drizzlePglite(client, { schema });

  // Aplica o DDL na primeira subida. As migrations vêm do drizzle-kit, então o
  // esquema local é byte a byte o que vai para o Neon.
  const ready = (async () => {
    const { rows } = await client.query<{ exists: boolean }>(
      "select exists (select 1 from information_schema.tables where table_name = 'events') as exists",
    );
    if (rows[0]?.exists) return;
    for (const stmt of migrationSql().split("--> statement-breakpoint")) {
      const s = stmt.trim();
      if (s) await client.exec(s);
    }
  })();

  return { db, ready };
}

if (!g.__db) {
  const { db, ready } = build();
  g.__db = db;
  g.__dbReady = ready;
}

export const db = g.__db!;

/** Toda query precisa esperar isso. Em produção resolve na hora. */
export const dbReady = g.__dbReady!;

export { schema };
