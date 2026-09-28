import { notFound } from "next/navigation";
import {
  getEventBySlug, listParticipants, listRounds, listSpeakerRequests, listSpeakers,
  rafflePool,
} from "@/db/queries";
import AdminPanel from "./AdminPanel";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  const [people, pool, pending, approved, rounds] = await Promise.all([
    listParticipants(ev.id),
    rafflePool(ev.id),
    listSpeakerRequests(ev.id),
    listSpeakers(ev.id),
    listRounds(ev.id),
  ]);

  return (
    <AdminPanel
      ev={{
        slug: ev.slug,
        name: ev.name,
        state: ev.state,
        presenceCode: ev.presenceCode,
        raffleRound: ev.raffleRound,
      }}
      signups={people.length}
      poolSize={pool.length}
      people={people.map((p) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        present: p.present,
      }))}
      pending={pending.map((p) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        role: p.role,
        talkTitle: p.talkTitle,
        links: p.links ?? [],
      }))}
      approved={approved.map((p) => ({
        id: p.id,
        name: p.name,
        talkTitle: p.talkTitle,
        links: (p.links ?? []).length + 1,
      }))}
      rounds={rounds}
    />
  );
}
