import "server-only";

/**
 * Thin client for https://api.wineapi.io (spec: https://api.wineapi.io/spec).
 *
 * The key is read from WINEAPI_KEY and sent in the X-API-Key header. In the Claude
 * cloud environment the network proxy injects the real key into that header, so
 * there the variable can be left unset.
 */
const BASE = "https://api.wineapi.io";

export class WineApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface WineSummary {
  id: string;
  name: string;
  vintage: number | null;
  type: string;
  winery: string | null;
  region: string | null;
  country: string | null;
  averageRating?: number | null;
  ratingsCount?: number | null;
}

export interface WineDetail {
  id: string;
  name: string;
  vintage: number | null;
  type: string;
  body: string | null;
  acidity: string | null;
  elaborate: string | null;
  classification: string | null;
  averageRating: number | null;
  ratingsCount: number | null;
  winery: { id: string; name: string } | null;
  region: { id: string; name: string; country: string } | null;
  appellation: string | null;
  grapes?: { id: string; name: string; color: string | null }[];
  alcoholContent: number | null;
  description: string | null;
  imageUrl: string | null;
  priceRange: { min: number; max: number; currency: string } | null;
  prices?: { merchantName: string; price: number; currency: string; url: string | null; fetchedAt: string }[];
  scores?: { score: number | null; scoreText: string | null; reviewer: string; reviewDate: string | null }[];
  pairings?: { food: string; confidence: number | null; notes: string | null }[];
}

async function get<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": process.env.WINEAPI_KEY || "proxy-injected",
    },
    next: { revalidate },
  });
  if (!res.ok) {
    let message = `WineAPI returned ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {}
    throw new WineApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export function searchWines(q: string, limit = 24, offset = 0) {
  const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) });
  return get<{ results: WineSummary[]; total: number; limit: number; offset: number }>(
    `/wines/search?${params}`,
    60 * 60,
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isWineApiId(id: string): boolean {
  return UUID.test(id);
}

export function getWine(id: string) {
  return get<WineDetail>(`/wines/${encodeURIComponent(id)}`, 60 * 60 * 6);
}

export function pairingLabels(pairings: WineDetail["pairings"]): string[] {
  if (!Array.isArray(pairings)) return [];
  return [...new Set(pairings.map((p) => p?.food).filter((f): f is string => typeof f === "string" && f.length > 0))];
}
