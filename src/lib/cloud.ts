import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Tracked } from "./leads";

// The publishable key is meant to ship in the browser; row-level security on
// tracked_leads is what keeps each account's data private.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://taedsrobclkpxfqbfxci.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_USbTXQrOy5Izhj9_0PSoiw_V_8iqjs1";

export const supabase: SupabaseClient = createClient(url, publishableKey);

const TABLE = "tracked_leads";

export type Sync = {
  load: () => Promise<Record<string, Tracked>>;
  save: (entry: Tracked) => void;
};

export function cloudSync(client: SupabaseClient): Sync {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const write = async (entry: Tracked) => {
    const { error } = await client
      .from(TABLE)
      .upsert(
        { lead_id: entry.lead.id, data: entry, updated_at: new Date(entry.updatedAt).toISOString() },
        { onConflict: "user_id,lead_id" }
      );
    if (error) console.error("Falha ao salvar na nuvem", error);
  };

  return {
    async load() {
      const { data, error } = await client.from(TABLE).select("lead_id, data");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.lead_id as string, row.data as Tracked]));
    },
    // Notes change on every keystroke, so writes are debounced per lead.
    save(entry) {
      const id = entry.lead.id;
      clearTimeout(timers.get(id));
      timers.set(id, setTimeout(() => void write(entry), 700));
    },
  };
}
