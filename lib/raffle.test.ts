import { describe, expect, it } from "vitest";
import { draw, seedFor, shuffle } from "./raffle";

const pool = Array.from({ length: 13 }, (_, i) => `p${i}`);

describe("seedFor", () => {
  it("é estável e legível", () => {
    expect(seedFor("K7QX", 1, "meetup-outubro")).toBe("meetup-outubro.k7qx.r1");
  });

  it("ignora a caixa do código", () => {
    expect(seedFor("k7qx", 2, "x")).toBe(seedFor("K7QX", 2, "x"));
  });
});

describe("shuffle", () => {
  it("preserva todos os elementos exatamente uma vez", () => {
    const out = shuffle("seed", pool);
    expect(out).toHaveLength(pool.length);
    expect([...out].sort()).toEqual([...pool].sort());
  });

  it("não modifica o array original", () => {
    const copia = [...pool];
    shuffle("seed", pool);
    expect(pool).toEqual(copia);
  });
});

describe("draw", () => {
  it("é determinístico: a mesma seed dá sempre o mesmo ganhador", () => {
    const s = seedFor("K7QX", 1, "meetup-outubro");
    expect(draw(s, pool).winners).toEqual(draw(s, pool).winners);
  });

  it("muda de resultado quando a rodada muda", () => {
    const a = draw(seedFor("K7QX", 1, "ev"), pool).winners[0];
    const b = draw(seedFor("K7QX", 2, "ev"), pool).winners[0];
    expect(a).not.toBe(b);
  });

  it("muda de resultado quando o código muda", () => {
    const a = draw(seedFor("AAAA", 1, "ev"), pool).winners[0];
    const b = draw(seedFor("BBBB", 1, "ev"), pool).winners[0];
    expect(a).not.toBe(b);
  });

  it("entrega suplentes sem repetir o ganhador", () => {
    const { winners, backups } = draw("s", pool, 1);
    expect(backups).toHaveLength(3);
    expect(backups).not.toContain(winners[0]);
    expect(new Set([...winners, ...backups]).size).toBe(4);
  });

  it("sorteia vários ganhadores distintos de uma vez", () => {
    const { winners } = draw("s", pool, 3);
    expect(winners).toHaveLength(3);
    expect(new Set(winners).size).toBe(3);
  });

  it("publica a prova necessária para reconferir", () => {
    const { proof } = draw("meetup.k7qx.r1", pool, 1);
    expect(proof).toEqual({ seed: "meetup.k7qx.r1", poolSize: 13, count: 1 });
  });

  it("aguenta pool de um só e pool vazio", () => {
    expect(draw("s", ["unico"]).winners).toEqual(["unico"]);
    expect(draw("s", []).winners).toEqual([]);
  });

  it("não pede mais ganhadores do que existe no pool", () => {
    expect(draw("s", ["a", "b"], 5).winners).toHaveLength(2);
  });

  it("distribui de forma uniforme", () => {
    const vezes = new Map<string, number>();
    const rodadas = 13_000;
    for (let i = 0; i < rodadas; i++) {
      const w = draw(`seed-${i}`, pool).winners[0];
      vezes.set(w, (vezes.get(w) ?? 0) + 1);
    }
    const esperado = rodadas / pool.length; // 1000
    expect(vezes.size).toBe(pool.length);
    for (const n of vezes.values()) {
      // Margem de 15%: aperta o suficiente para pegar viés real.
      expect(n).toBeGreaterThan(esperado * 0.85);
      expect(n).toBeLessThan(esperado * 1.15);
    }
  });
});
