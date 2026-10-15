import { sql } from "kysely";
import { getDb } from "@/lib/db";

/** Separate launch notifications from newsletter consent. Duplicate signups are harmless. */
export async function joinWaitlist(email: string): Promise<void> {
  await sql`insert into public.waitlist_entries (email) values (${email})
    on conflict (email) do nothing`.execute(getDb());
}
