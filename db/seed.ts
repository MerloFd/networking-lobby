import { db, dbReady } from "./index";
import { events, organizers, participants } from "./schema";
import type { Area, Seniority } from "../lib/domain";

type Row = [string, string, Area[], Seniority, string | undefined, boolean];

const PEOPLE: Row[] = [
  ["matheus-merlo", "Matheus Merlo", ["Frontend", "Mobile"], "até 2", "Fullstack React e React Native", true],
  ["ana-beatriz-dev", "Ana Beatriz Cardoso", ["Backend"], "3 a 5", "Node e Go, time de pagamentos", true],
  ["carlos-eduardo-s", "Carlos Eduardo Silva", ["DevOps", "Backend"], "6 a 10", "Kubernetes e Terraform", true],
  ["fernanda-lima-data", "Fernanda Lima", ["Data"], "3 a 5", "Engenharia de dados, dbt e Airflow", true],
  ["pedro-hn", "Pedro Henrique Nogueira", ["Mobile"], "até 2", "Flutter, primeiro app na loja esse mes", true],
  ["larissa-moraes", "Larissa Moraes", ["Product", "Gestão"], "6 a 10", undefined, false],
  ["thiago-albuq", "Thiago Albuquerque", ["Security", "Backend"], "10+", "AppSec e pentest", true],
  ["juliana-ferraz", "Juliana Ferraz", ["Design", "Product"], "3 a 5", "UX research em fintech", true],
  ["bruno-tanaka", "Bruno Tanaka", ["Backend"], "10+", "Arquitetura distribuida, .NET", true],
  ["camila-rocha-qa", "Camila Rocha", ["QA", "Backend"], "3 a 5", "Automacao com Playwright", false],
  ["rodrigo-mesquita", "Rodrigo Mesquita", ["Gestão"], "10+", "Eng. Manager, 3 squads", true],
  ["isabela-nunes", "Isabela Nunes", ["Estudante", "Frontend"], "até 2", "ADS 3 semestre, buscando estagio", true],
  ["gustavo-pereira-dev", "Gustavo Pereira", ["Frontend", "Design"], "3 a 5", "Vue e design systems", true],
  ["natalia-castro", "Natália Castro", ["Data", "Outro"], "até 2", "Transicao de carreira", true],
  ["lucas-barreto", "Lucas Barreto", ["Backend"], "até 2", "PHP e Laravel", false],
  ["mariana-duarte", "Mariana Duarte", ["DevOps"], "3 a 5", "Plataforma interna, AWS", true],
  ["felipe-andrade", "Felipe Andrade", ["Mobile", "Frontend"], "6 a 10", "React Native, 11 apps publicados", true],
  ["sofia-ribeiro", "Sofia Ribeiro", ["Product"], "até 2", "PM junior em healthtech", false],
];

async function main() {
  await dbReady;
  const existing = await db.select().from(organizers).limit(1);
  if (existing.length) {
    console.log("Banco já tem dados. Apague a pasta .pglite para recomeçar.");
    return;
  }

  const [org] = await db
    .insert(organizers)
    .values({ name: "Comunidade Dev Local" })
    .returning();

  const [ev] = await db
    .insert(events)
    .values({
      organizerId: org.id,
      slug: "meetup-outubro",
      name: "Meetup Dev de Outubro",
      happensOn: "2026-10-24",
      venue: "Auditório do Parque Tecnológico",
      state: "aberto",
      presenceCode: "K7QX",
      presenceCodeAt: new Date(),
    })
    .returning();

  await db.insert(events).values([
    { organizerId: org.id, slug: "workshop-docker", name: "Workshop de Docker", happensOn: "2026-11-12", state: "rascunho" },
    { organizerId: org.id, slug: "meetup-setembro", name: "Meetup Dev de Setembro", happensOn: "2026-09-26", state: "encerrado" },
  ]);

  await db.insert(participants).values(
    PEOPLE.map(([handle, name, areas, years, bio, present]) => ({
      eventId: ev.id, handle, name, areas, years, bio: bio ?? null, present,
    })),
  );

  // Um pedido de palestra pendente, para a tela de aprovação ter o que mostrar.
  await db.insert(participants).values({
    eventId: ev.id,
    handle: "marina-okabe-exemplo",
    name: "Marina Okabe",
    areas: ["Backend", "DevOps"],
    years: "10+",
    present: true,
    speakerStatus: "pendente",
    role: "Staff Engineer na Vertek",
    talkTitle: "Migrando 400 serviços sem downtime",
    links: [
      { label: "Github", url: "https://github.com/exemplo" },
      { label: "Blog", url: "https://exemplo.dev" },
    ],
  });

  console.log(`Pronto. ${PEOPLE.length + 1} inscritos em /e/meetup-outubro`);
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
