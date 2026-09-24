import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  defaultSettings,
  settingsSchemas,
  type SettingsKey,
  type StoreSettings,
} from "@/lib/settings-schema";

/** Reads every settings document, falling back to defaults per section. */
export const getSettings = cache(async (): Promise<StoreSettings> => {
  const db = await getDb();
  const rows = await db.select().from(schema.storeSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = { ...defaultSettings } as Record<SettingsKey, unknown>;
  for (const key of Object.keys(settingsSchemas) as SettingsKey[]) {
    const raw = map.get(key);
    if (raw == null) continue;
    const parsed = settingsSchemas[key].safeParse({
      ...(defaultSettings[key] as object),
      ...(raw as object),
    });
    if (parsed.success) out[key] = parsed.data;
  }
  return out as StoreSettings;
});

export async function saveSettings<K extends SettingsKey>(key: K, value: StoreSettings[K]) {
  const db = await getDb();
  const parsed = settingsSchemas[key].parse(value);
  await db
    .insert(schema.storeSettings)
    .values({ key, value: parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.storeSettings.key,
      set: { value: parsed, updatedAt: new Date() },
    });
  return parsed;
}

export async function getSessionSecretFromDb(): Promise<string | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.storeSettings)
    .where(eq(schema.storeSettings.key, "_session_secret"));
  return (row?.value as string) ?? null;
}

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
