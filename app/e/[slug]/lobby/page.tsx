import { notFound } from "next/navigation";
import { EventChrome } from "@/components/ui";
import { getEventBySlug, listParticipants } from "@/db/queries";
import type { Area } from "@/lib/domain";
import LobbyList from "./LobbyList";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();

  const rows = await listParticipants(ev.id);
  const people = rows.map((p) => ({
    handle: p.handle,
    name: p.name,
    areas: p.areas as Area[],
    years: p.years,
    bio: p.bio ?? undefined,
  }));

  return (
    <>
      <EventChrome slug={ev.slug} name={ev.name} tab="lobby" />
      <LobbyList slug={ev.slug} people={people} />
    </>
  );
}
