export type WineType = "red" | "white" | "rose" | "orange" | "sparkling" | "dessert";

export const WINE_TYPES: { id: WineType; label: string }[] = [
  { id: "red", label: "Red" },
  { id: "white", label: "White" },
  { id: "rose", label: "Rosé" },
  { id: "orange", label: "Orange" },
  { id: "sparkling", label: "Sparkling" },
  { id: "dessert", label: "Dessert" },
];

/** Map a free-form type string (from WineAPI or a form) onto the design system's wine types. */
export function toWineType(raw?: string | null): WineType | undefined {
  const s = (raw ?? "").toLowerCase();
  if (!s) return undefined;
  if (s.includes("spark") || s.includes("champ") || s.includes("cava") || s.includes("prosecco")) return "sparkling";
  if (s.includes("ros")) return "rose";
  if (s.includes("orange") || s.includes("skin")) return "orange";
  if (s.includes("dessert") || s.includes("fortif") || s.includes("sweet") || s.includes("port")) return "dessert";
  if (s.includes("white")) return "white";
  if (s.includes("red")) return "red";
  return undefined;
}

export function wineTypeLabel(t?: WineType): string | undefined {
  return WINE_TYPES.find((w) => w.id === t)?.label;
}

/** Scores are always numbers with one decimal. */
export function formatScore(n: number): string {
  return n.toFixed(1);
}

/** A wine as stored in the cellar. */
export interface CellarWine {
  id: string;
  source: "wineapi" | "manual";
  name: string;
  winery: string | null;
  region: string | null;
  country: string | null;
  vintage: number | null;
  type: WineType | null;
  imageUrl: string | null;
  communityRating: number | null;
  communityCount: number | null;
  savedAt: string;
  score: number | null;
  note: string | null;
  ratedAt: string | null;
}
