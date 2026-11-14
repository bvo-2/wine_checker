"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCellarWine, removeWine, saveWine, setNote, setRating, type WineInput } from "@/lib/db";
import { toWineType } from "@/lib/types";
import { getWine, isWineApiId } from "@/lib/wineapi";

/** Parse the JSON payload a card posts. Only known fields are kept. */
function parsePayload(raw: FormDataEntryValue | null): WineInput | null {
  if (typeof raw !== "string") return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 300) : null);
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
    const id = str(p.id);
    const name = str(p.name);
    if (!id || !name) return null;
    return {
      id,
      source: p.source === "manual" ? "manual" : "wineapi",
      name,
      winery: str(p.winery),
      region: str(p.region),
      country: str(p.country),
      vintage: num(p.vintage),
      type: toWineType(str(p.type)) ?? null,
      imageUrl: str(p.imageUrl),
      communityRating: num(p.communityRating),
      communityCount: num(p.communityCount),
    };
  } catch {
    return null;
  }
}

/** Best effort: fill in the bottle shot and community score from WineAPI when saving. */
async function enrich(w: WineInput): Promise<WineInput> {
  if (w.source !== "wineapi" || !isWineApiId(w.id)) return w;
  try {
    const d = await getWine(w.id);
    return {
      ...w,
      imageUrl: w.imageUrl ?? d.imageUrl,
      communityRating: d.averageRating ?? w.communityRating,
      communityCount: d.ratingsCount ?? w.communityCount,
    };
  } catch {
    return w;
  }
}

function refresh(id?: string) {
  revalidatePath("/");
  revalidatePath("/search");
  if (id) revalidatePath(`/wines/${id}`);
}

export async function toggleSaveAction(formData: FormData) {
  const wine = parsePayload(formData.get("payload"));
  if (!wine) return;
  if (formData.get("saved") === "1") {
    removeWine(wine.id);
  } else {
    saveWine(await enrich(wine));
  }
  refresh(wine.id);
}

export async function rateAction(formData: FormData) {
  const wine = parsePayload(formData.get("payload"));
  const score = Number(formData.get("score"));
  if (!wine || !Number.isInteger(score) || score < 1 || score > 5) return;
  // Rating a wine keeps it in the cellar.
  if (!getCellarWine(wine.id)) saveWine(await enrich(wine));
  setRating(wine.id, score);
  refresh(wine.id);
}

export async function noteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 4000);
  if (!id || !getCellarWine(id)?.score) return;
  setNote(id, note.trim());
  refresh(id);
}

export async function removeAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  removeWine(id);
  refresh(id);
  redirect("/");
}

export interface AddWineState {
  errors?: Partial<Record<"name" | "vintage" | "score", string>>;
  values?: Record<string, string>;
}

export async function addWineAction(_prev: AddWineState, formData: FormData): Promise<AddWineState> {
  const values = Object.fromEntries(
    ["name", "winery", "region", "country", "vintage", "type", "score", "note"].map((k) => [k, String(formData.get(k) ?? "").trim()]),
  );
  const errors: AddWineState["errors"] = {};
  if (!values.name) errors.name = "Enter the wine's name.";
  const vintage = values.vintage ? Number(values.vintage) : null;
  if (vintage != null && (!Number.isInteger(vintage) || vintage < 1800 || vintage > new Date().getFullYear()))
    errors.vintage = "Enter a four-digit year, or leave it empty for non-vintage.";
  const score = values.score ? Number(values.score) : null;
  if (score != null && (!Number.isInteger(score) || score < 1 || score > 5)) errors.score = "Choose 1 to 5 stars.";
  else if (score == null && values.note) errors.score = "Add a rating to keep your tasting note.";
  if (Object.keys(errors).length) return { errors, values };

  const id = `m_${randomUUID()}`;
  saveWine({
    id,
    source: "manual",
    name: values.name.slice(0, 300),
    winery: values.winery || null,
    region: values.region || null,
    country: values.country || null,
    vintage,
    type: toWineType(values.type) ?? null,
  });
  if (score) setRating(id, score, values.note || null);
  refresh(id);
  redirect(`/wines/${id}`);
}
