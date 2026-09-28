import { desc, eq } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { events } from "@/db/schema";
import { currentOrganizer } from "@/db/queries";
import NewEventForm from "./NewEventForm";

export default async function NewEventPage() {
  // Evento de comunidade é recorrente: o último serve de molde para o próximo.
  const org = await currentOrganizer();
  await dbReady;
  const last = org
    ? (
        await db
          .select({ name: events.name, venue: events.venue })
          .from(events)
          .where(eq(events.organizerId, org.id))
          .orderBy(desc(events.happensOn))
          .limit(1)
      )[0]
    : undefined;

  return (
    <div className="aurora">
      <NewEventForm lastEvent={last} />
    </div>
  );
}
