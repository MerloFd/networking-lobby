import Link from "next/link";
import { formatShort, Logo } from "@/components/ui";
import { currentOrganizer, listEventsOf } from "@/db/queries";

const STATE_STYLE = {
  rascunho: { label: "Rascunho", cls: "bg-raised text-muted" },
  aberto: { label: "Aberto", cls: "bg-good/15 text-good" },
  sorteio: { label: "Sorteio", cls: "bg-accent-2/20 text-accent-2" },
  encerrado: { label: "Encerrado", cls: "bg-raised text-muted" },
} as const;

const TODAY = "2026-09-28";

export default async function OrgHome() {
  const org = await currentOrganizer();
  const all = org ? await listEventsOf(org.id) : [];
  const live = all.filter((e) => e.happensOn >= TODAY || e.state === "aberto" || e.state === "sorteio");
  const past = all.filter((e) => !live.includes(e));
  const totalSignups = all.reduce((s, e) => s + e.signups, 0);

  return (
    <div className="aurora">
      <main className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-8">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-accent">
          <Logo />
          node
        </p>
        <h1 className="ink-grad mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight">
          Seus eventos
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {org?.name ?? "Sem organizador"} · {totalSignups} inscrições no total
        </p>

        <Link
          href="/admin/novo"
          className="press mt-6 block rounded-xl bg-accent py-4 text-center font-semibold text-white"
        >
          Criar evento
        </Link>

        {live.length > 0 && (
          <>
            <h2 className="mb-3 mt-9 text-[13px] font-semibold uppercase tracking-wide text-muted">
              Ativos
            </h2>
            <ul className="space-y-2">
              {live.map((e, i) => <Row key={e.slug} e={e} i={i} />)}
            </ul>
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mb-3 mt-8 text-[13px] font-semibold uppercase tracking-wide text-muted">
              Encerrados
            </h2>
            <ul className="space-y-2">
              {past.map((e, i) => <Row key={e.slug} e={e} i={i} />)}
            </ul>
          </>
        )}

        {all.length === 0 && (
          <p className="mt-8 rounded-2xl border border-line bg-surface p-5 text-[15px] leading-relaxed text-muted">
            Nenhum evento ainda. Criar leva dois campos.
          </p>
        )}

        <p className="mt-8 rounded-2xl border border-line bg-surface p-4 text-[13px] leading-relaxed text-muted">
          Os eventos encerrados não somem: o lobby de cada um segue no ar, e é dali que
          vai sair o histórico de quem participou de quantos eventos seus.
        </p>
      </main>
    </div>
  );
}

type Ev = { slug: string; name: string; happensOn: string; state: keyof typeof STATE_STYLE; signups: number };

function Row({ e, i }: { e: Ev; i: number }) {
  const s = STATE_STYLE[e.state];
  return (
    <li className="rise" style={{ animationDelay: `${i * 60}ms` }}>
      <Link
        href={`/e/${e.slug}/admin`}
        className="press flex items-center gap-3 rounded-2xl border border-line bg-surface p-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{e.name}</h3>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
              {s.label}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            {formatShort(e.happensOn)} · {e.signups} {e.signups === 1 ? "inscrito" : "inscritos"}
          </p>
        </div>
        <span className="shrink-0 text-muted">›</span>
      </Link>
    </li>
  );
}
