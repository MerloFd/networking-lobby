/**
 * Normalização do handle do LinkedIn.
 *
 * É a peça mais frágil do sistema, porque o handle é a chave única contra
 * duplicado. Se "Matheus-Merlo/" e "pt.linkedin.com/in/matheus-merlo?utm_source=share"
 * virarem duas linhas, a mesma pessoa entra duas vezes no lobby e concorre duas
 * vezes ao sorteio. Por isso tudo passa por aqui, e por isso tem teste.
 *
 * O que as pessoas realmente colam num evento:
 *   https://www.linkedin.com/in/matheus-merlo/
 *   https://pt.linkedin.com/in/matheus-merlo
 *   linkedin.com/in/matheus-merlo?utm_source=share&utm_medium=member_ios
 *   https://www.linkedin.com/mwlite/in/matheus-merlo      (compartilhar do app)
 *   https://www.linkedin.com/pub/matheus-merlo/1/2a/3b     (perfis antigos)
 *   matheus-merlo
 *   @matheus-merlo
 */

export type HandleResult =
  | { ok: true; handle: string }
  | { ok: false; reason: HandleError };

export type HandleError =
  | "vazio"
  | "nao-e-perfil"
  | "curto"
  | "longo"
  | "caracteres-invalidos";

export const HANDLE_ERRORS: Record<HandleError, string> = {
  vazio: "Cole o link do seu LinkedIn.",
  "nao-e-perfil":
    "Esse link não é de um perfil. Precisa ser o endereço que começa com linkedin.com/in/.",
  curto: "Handle curto demais, confira se copiou inteiro.",
  longo: "Handle longo demais, confira se copiou só o endereço do perfil.",
  "caracteres-invalidos":
    "O handle só aceita letras, números e hífen. Confira se colou o link certo.",
};

/** Páginas do LinkedIn que não são perfil e aparecem em paste errado. */
const NOT_PROFILE = new Set([
  "feed", "company", "school", "jobs", "groups", "showcase", "learning",
  "posts", "pulse", "events", "messaging", "mynetwork", "notifications",
  "checkpoint", "authwall", "search", "help", "legal",
]);

export function normalizeHandle(raw: string): HandleResult {
  let v = (raw ?? "").trim();
  if (!v) return { ok: false, reason: "vazio" };

  // Quem cola do app às vezes trás o link entre sinais ou com texto de share.
  v = v.replace(/^[<("'\s]+|[>)"'\s]+$/g, "");

  try {
    v = decodeURIComponent(v);
  } catch {
    // Percent encoding quebrado: segue com o texto cru em vez de recusar.
  }

  v = v.toLowerCase();
  v = v.replace(/^https?:\/\//, "");
  // Subdomínio de idioma (pt., br., de.) e os móveis (m., mwlite).
  v = v.replace(/^(www|m|[a-z]{2})\./, "");

  if (v.startsWith("linkedin.com")) {
    v = v.slice("linkedin.com".length).replace(/^\/+/, "");
    v = v.replace(/^mwlite\//, "");

    const seg = v.split(/[/?#]/)[0];
    if (NOT_PROFILE.has(seg)) return { ok: false, reason: "nao-e-perfil" };

    const m = v.match(/^(?:in|pub)\/([^/?#]+)/);
    if (!m) return { ok: false, reason: "nao-e-perfil" };
    v = m[1];
  } else if (v.includes("linkedin.com")) {
    // Domínio estranho tipo "algo.linkedin.com.br/in/x": recusa em vez de adivinhar.
    const m = v.match(/linkedin\.com[^/]*\/(?:in|pub)\/([^/?#]+)/);
    if (!m) return { ok: false, reason: "nao-e-perfil" };
    v = m[1];
  } else {
    // Handle avulso. Aceita "@handle" e "in/handle".
    v = v.replace(/^@/, "").replace(/^in\//, "");
    v = v.split(/[/?#]/)[0];
  }

  v = v.replace(/\/+$/, "");
  if (!v) return { ok: false, reason: "vazio" };

  if (v.length < 3) return { ok: false, reason: "curto" };
  if (v.length > 100) return { ok: false, reason: "longo" };
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(v)) {
    return { ok: false, reason: "caracteres-invalidos" };
  }

  return { ok: true, handle: v };
}

export function profileUrl(handle: string) {
  return `https://www.linkedin.com/in/${handle}`;
}

/**
 * Nome provável a partir do handle: "matheus-merlo-123a4b" vira "Matheus Merlo".
 * Serve só para pré-preencher o campo, que segue editável.
 */
export function guessName(handle: string) {
  return handle
    .replace(/-?[0-9a-f]{4,}$/i, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
