/**
 * Sorteio determinístico e auditável.
 *
 * Por que não `Math.random()`: ninguém consegue reconferir o resultado depois.
 * Aqui o resultado é função pura de (seed, pool ordenado, quantidade). Publicando
 * a seed e a lista de concorrentes, qualquer pessoa da comunidade roda o mesmo
 * algoritmo e chega no mesmo ganhador. É o que responde a "esse sorteio foi
 * arranjado?" sem depender de confiança no organizador.
 *
 * A seed é montada com o código de presença do momento mais o round, valores que
 * o organizador não escolhe sozinho e que ficam visíveis no telão.
 */

/** PRNG de 32 bits, rápido e estável entre execuções. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: string para inteiro de 32 bits. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Fisher-Yates alimentado pela seed. Devolve a ordem completa, não só o topo:
 * com ela o organizador tem suplentes prontos se o primeiro nome não estiver
 * mais na sala, sem precisar sortear de novo.
 */
export function shuffle<T>(seed: string, pool: readonly T[]): T[] {
  const rnd = mulberry32(hashSeed(seed));
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type DrawResult<T> = {
  /** Ganhadores, na ordem sorteada. */
  winners: T[];
  /** Próximos da fila, para quando alguém já saiu do evento. */
  backups: T[];
  /** O que precisa ser publicado para o resultado ser reconferível. */
  proof: { seed: string; poolSize: number; count: number };
};

/**
 * Sorteia `count` nomes do pool. O pool precisa chegar sempre na mesma ordem
 * (ordene por data de inscrição antes de chamar) ou a prova não fecha.
 */
export function draw<T>(seed: string, pool: readonly T[], count = 1): DrawResult<T> {
  const order = shuffle(seed, pool);
  return {
    winners: order.slice(0, count),
    backups: order.slice(count, count + 3),
    proof: { seed, poolSize: pool.length, count },
  };
}

/** Monta a seed do round. Fica idêntica no telão e no painel. */
export function seedFor(code: string, round: number, eventSlug: string) {
  return `${eventSlug}.${code.toLowerCase()}.r${round}`;
}
