import { describe, expect, it } from "vitest";
import { guessName, normalizeHandle } from "./handle";

const ok = (input: string) => {
  const r = normalizeHandle(input);
  if (!r.ok) throw new Error(`esperava ok, veio ${r.reason} para "${input}"`);
  return r.handle;
};

const fail = (input: string) => {
  const r = normalizeHandle(input);
  if (r.ok) throw new Error(`esperava erro, veio "${r.handle}" para "${input}"`);
  return r.reason;
};

describe("normalizeHandle", () => {
  it("aceita a URL canônica com e sem barra final", () => {
    expect(ok("https://www.linkedin.com/in/matheus-merlo/")).toBe("matheus-merlo");
    expect(ok("https://www.linkedin.com/in/matheus-merlo")).toBe("matheus-merlo");
  });

  it("descarta a query de compartilhamento", () => {
    expect(
      ok("https://www.linkedin.com/in/matheus-merlo?utm_source=share&utm_medium=member_ios"),
    ).toBe("matheus-merlo");
    expect(ok("linkedin.com/in/matheus-merlo?originalSubdomain=br")).toBe("matheus-merlo");
  });

  it("descarta subdomínio de idioma e de mobile", () => {
    expect(ok("https://pt.linkedin.com/in/matheus-merlo")).toBe("matheus-merlo");
    expect(ok("https://br.linkedin.com/in/matheus-merlo")).toBe("matheus-merlo");
    expect(ok("https://m.linkedin.com/in/matheus-merlo")).toBe("matheus-merlo");
    expect(ok("https://www.linkedin.com/mwlite/in/matheus-merlo")).toBe("matheus-merlo");
  });

  it("aceita o formato antigo /pub/", () => {
    expect(ok("https://www.linkedin.com/pub/matheus-merlo/1/2a/3b")).toBe("matheus-merlo");
  });

  it("aceita handle avulso, com arroba e com prefixo in/", () => {
    expect(ok("matheus-merlo")).toBe("matheus-merlo");
    expect(ok("@matheus-merlo")).toBe("matheus-merlo");
    expect(ok("in/matheus-merlo")).toBe("matheus-merlo");
  });

  it("normaliza caixa e espaço em volta", () => {
    expect(ok("  HTTPS://WWW.LinkedIn.com/IN/Matheus-Merlo/  ")).toBe("matheus-merlo");
  });

  it("tira sinais que vêm colados no paste", () => {
    expect(ok("<https://www.linkedin.com/in/matheus-merlo>")).toBe("matheus-merlo");
    expect(ok('"linkedin.com/in/matheus-merlo"')).toBe("matheus-merlo");
  });

  it("resolve percent encoding", () => {
    expect(ok("https://www.linkedin.com/in/matheus%2Dmerlo")).toBe("matheus-merlo");
  });

  it("converge variações da mesma pessoa no mesmo handle", () => {
    const todas = [
      "https://www.linkedin.com/in/matheus-merlo/",
      "https://pt.linkedin.com/in/matheus-merlo?utm_source=share",
      "linkedin.com/in/Matheus-Merlo",
      "@matheus-merlo",
      "  matheus-merlo  ",
    ].map(ok);
    expect(new Set(todas).size).toBe(1);
  });

  it("recusa páginas que não são perfil", () => {
    expect(fail("https://www.linkedin.com/feed/")).toBe("nao-e-perfil");
    expect(fail("https://www.linkedin.com/company/vertek")).toBe("nao-e-perfil");
    expect(fail("https://www.linkedin.com/jobs/view/123")).toBe("nao-e-perfil");
    expect(fail("https://www.linkedin.com/")).toBe("nao-e-perfil");
  });

  it("recusa vazio e lixo", () => {
    expect(fail("")).toBe("vazio");
    expect(fail("   ")).toBe("vazio");
    expect(fail("ab")).toBe("curto");
    expect(fail("a".repeat(101))).toBe("longo");
  });

  it("recusa caracteres fora do permitido", () => {
    expect(fail("matheus merlo")).toBe("caracteres-invalidos");
    expect(fail("matheus_merlo")).toBe("caracteres-invalidos");
    expect(fail("matheus.merlo")).toBe("caracteres-invalidos");
    expect(fail("-matheus")).toBe("caracteres-invalidos");
    expect(fail("matheus-")).toBe("caracteres-invalidos");
    expect(fail("matheús-merlo")).toBe("caracteres-invalidos");
  });

  it("é idempotente", () => {
    const uma = ok("https://www.linkedin.com/in/matheus-merlo/");
    expect(ok(uma)).toBe(uma);
  });
});

describe("guessName", () => {
  it("capitaliza as partes do handle", () => {
    expect(guessName("matheus-merlo")).toBe("Matheus Merlo");
    expect(guessName("ana-beatriz-cardoso")).toBe("Ana Beatriz Cardoso");
  });

  it("descarta o sufixo aleatório que o LinkedIn adiciona", () => {
    expect(guessName("matheus-merlo-1a2b3c")).toBe("Matheus Merlo");
  });

  it("não quebra com handle de uma palavra", () => {
    expect(guessName("merlo")).toBe("Merlo");
  });
});
