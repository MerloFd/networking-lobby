/** Vocabulário do domínio. Vive fora do mock porque agora é contrato de banco. */

export const AREAS = [
  "Backend", "Frontend", "Data", "DevOps", "Mobile",
  "Product", "Design", "QA", "Security", "Gestão", "Estudante", "Outro",
] as const;
export type Area = (typeof AREAS)[number];

/** Mais que isso e o card do lobby vira sopa de etiqueta. */
export const MAX_AREAS = 3;

export const SENIORITY = ["até 2", "3 a 5", "6 a 10", "10+"] as const;
export type Seniority = (typeof SENIORITY)[number];

export const STATE_HINT = {
  rascunho: "Ninguém consegue se cadastrar ainda.",
  aberto: "O QR está no telão e o cadastro aceita entradas.",
  sorteio: "Janela curta. Só quem digitar o código concorre.",
  encerrado: "Cadastro fechado. O lobby continua no ar.",
} as const;
