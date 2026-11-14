import type { CellarWine } from "./types";
import type { WineDetail, WineSummary } from "./wineapi";

/** JSON posted by save/rate forms so a wine can be stored without another lookup. */
export function payloadFromSummary(w: WineSummary): string {
  return JSON.stringify({
    id: w.id,
    source: "wineapi",
    name: w.name,
    winery: w.winery,
    region: w.region,
    country: w.country,
    vintage: w.vintage,
    type: w.type,
    communityRating: w.averageRating ?? null,
    communityCount: w.ratingsCount ?? null,
  });
}

export function payloadFromDetail(d: WineDetail): string {
  return JSON.stringify({
    id: d.id,
    source: "wineapi",
    name: d.name,
    winery: d.winery?.name ?? null,
    region: d.region?.name ?? null,
    country: d.region?.country ?? null,
    vintage: d.vintage,
    type: d.type,
    imageUrl: d.imageUrl,
    communityRating: d.averageRating,
    communityCount: d.ratingsCount,
  });
}

export function payloadFromCellar(w: CellarWine): string {
  return JSON.stringify({
    id: w.id,
    source: w.source,
    name: w.name,
    winery: w.winery,
    region: w.region,
    country: w.country,
    vintage: w.vintage,
    type: w.type,
    imageUrl: w.imageUrl,
    communityRating: w.communityRating,
    communityCount: w.communityCount,
  });
}
