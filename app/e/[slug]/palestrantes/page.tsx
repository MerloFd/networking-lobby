import { notFound } from "next/navigation";
import { Avatar, EventChrome, formatDate, initialsOf } from "@/components/ui";
import { getEventBySlug, listSpeakers } from "@/db/queries";
import { avatarStyle } from "@/lib/style";

export default async function SpeakersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  const speakers = await listSpeakers(ev.id);

  return (
    <div className="aurora">
      <EventChrome slug={ev.slug} name={ev.name} tab="palestrantes" />
      <main className="relative mx-auto max-w-2xl px-5 pb-16 pt-6">
        <h1 className="ink-grad relative z-10 text-[28px] font-semibold leading-[1.15] tracking-tight">
          Palestrantes
        </h1>
        <p className="relative z-10 mt-2 text-[15px] leading-relaxed text-muted">
          Todos os links das talks em um lugar. Ninguém precisa fotografar QR code no
          meio da apresentação.
        </p>

        {speakers.length === 0 ? (
          <div className="relative z-10 mt-7 rounded-2xl border border-line bg-surface p-5">
            <p className="text-[15px] font-semibold">Ainda não tem palestrante aqui</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
              Se você vai palestrar, marque "Sou palestrante" ao entrar no lobby. O
              organizador aprova e seu card aparece nessa aba.
            </p>
          </div>
        ) : (
          <div className="relative z-10 mt-7 space-y-3">
            {speakers.map((s, i) => {
              const accent = avatarStyle(s.name).color;
              const links = [
                { label: "LinkedIn", url: `https://www.linkedin.com/in/${s.handle}` },
                ...(s.links ?? []),
              ];
              return (
                <article
                  key={s.id}
                  className="rise overflow-hidden rounded-2xl border border-line bg-surface"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="h-1" style={avatarStyle(s.name)} />
                  <div className="p-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar initials={initialsOf(s.name)} seed={s.name} size={52} />
                      <div className="min-w-0">
                        <h2 className="truncate text-[17px] font-semibold">{s.name}</h2>
                        {s.role && (
                          <p className="truncate text-[13px] text-muted">{s.role}</p>
                        )}
                      </div>
                    </div>

                    {s.talkTitle && (
                      <p
                        className="mt-4 border-l-2 pl-3 text-[15px] font-medium leading-snug"
                        style={{ borderColor: accent }}
                      >
                        {s.talkTitle}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="press rounded-xl border border-line bg-raised px-3.5 py-2.5 text-[13px] font-semibold"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="relative z-10 mt-8 rounded-2xl border border-line bg-gradient-to-br from-accent/8 to-transparent p-4">
          <p className="text-[15px] font-semibold">{ev.name}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {formatDate(ev.happensOn)}
            {ev.venue ? ` · ${ev.venue}` : ""}
          </p>
        </div>
      </main>
    </div>
  );
}
