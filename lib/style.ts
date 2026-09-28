import type { Area } from "./domain";

/**
 * Cada área tem seu matiz. Não é enfeite: com 80 pessoas na lista, a cor é o
 * que deixa você varrer a tela procurando gente da sua stack sem ler nome por nome.
 */
export const AREA_HUE: Record<Area, number> = {
  Backend: 212,
  Frontend: 268,
  Data: 188,
  DevOps: 28,
  Mobile: 330,
  Product: 48,
  Design: 300,
  QA: 158,
  Security: 4,
  Gestão: 232,
  Estudante: 128,
  Outro: 208,
};

export function areaChip(area: Area) {
  const h = AREA_HUE[area];
  return {
    color: `hsl(${h} 90% 76%)`,
    background: `hsl(${h} 62% 22% / 0.6)`,
    borderColor: `hsl(${h} 58% 44% / 0.38)`,
  };
}

export function areaSolid(area: Area) {
  const h = AREA_HUE[area];
  return {
    color: "#fff",
    background: `linear-gradient(135deg, hsl(${h} 72% 52%), hsl(${h + 18} 74% 42%))`,
    borderColor: `hsl(${h} 70% 60% / 0.5)`,
  };
}

/** Avatar ganha gradiente próprio derivado do nome. Determinístico e sem imagem. */
export function avatarStyle(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return {
    background: `linear-gradient(140deg, hsl(${h} 58% 34%), hsl(${(h + 48) % 360} 62% 22%))`,
    color: `hsl(${h} 92% 86%)`,
    boxShadow: `inset 0 0 0 1px hsl(${h} 60% 60% / 0.28)`,
  };
}
