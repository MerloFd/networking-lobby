import { notFound } from "next/navigation";
import { getEventBySlug, listParticipants } from "@/db/queries";
import Telao from "./Telao";

// O telão fica aberto no projetor durante o evento: precisa refletir o banco.
export const revalidate = 5;

export default async function TelaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) notFound();
  const people = await listParticipants(ev.id);

  return <Telao slug={ev.slug} code={ev.presenceCode} count={people.length} />;
}
