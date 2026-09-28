import { notFound } from "next/navigation";
import { EventChrome, formatDate } from "@/components/ui";
import { getEventBySlug } from "@/db/queries";
import JoinForm from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  const closed = ev.state === "rascunho" || ev.state === "encerrado";

  return (
    <div className="aurora">
      <EventChrome slug={ev.slug} name={ev.name} tab="entrar" />
      <main className="relative mx-auto max-w-2xl px-5 pb-32 pt-6">
        <p className="relative z-10 text-[13px] font-semibold text-accent">
          {formatDate(ev.happensOn)}
          {ev.venue ? ` · ${ev.venue}` : ""}
        </p>
        <h1 className="ink-grad relative z-10 mt-1.5 text-[28px] font-semibold leading-[1.15] tracking-tight">
          Entre no lobby do evento
        </h1>

        {closed ? (
          <div className="relative z-10 mt-6 rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] font-semibold">
              {ev.state === "rascunho"
                ? "O cadastro ainda não abriu"
                : "O cadastro encerrou"}
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              {ev.state === "rascunho"
                ? "Volte quando o organizador liberar. O QR já é esse mesmo."
                : "Mas o lobby continua no ar, dá para conectar com quem estava lá."}
            </p>
          </div>
        ) : (
          <>
            <p className="relative z-10 mt-2 text-[15px] leading-relaxed text-muted">
              Leva 15 segundos. Depois você vê quem mais está aqui e conecta com quem
              quiser. A lista fica no ar mesmo depois do evento.
            </p>
            <JoinForm slug={ev.slug} raffleOpen={Boolean(ev.presenceCode)} />
          </>
        )}
      </main>
    </div>
  );
}
