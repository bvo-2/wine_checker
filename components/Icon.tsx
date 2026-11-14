export type IconName = "heart" | "heart-filled" | "search" | "back" | "close" | "share" | "star" | "star-filled" | "alert" | "plus";

/** Simple 2px-stroke line glyphs drawn in currentColor. Filled heart and star are the only solid glyphs. */
export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2 * (32 / Math.max(size, 16)),
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  switch (name) {
    case "heart":
    case "heart-filled":
      return (
        <svg {...common} fill={name === "heart-filled" ? "currentColor" : "none"}>
          <path d="M16 27s-11-6.6-11-14.2C5 8.5 8 6 11.3 6c2.2 0 3.8 1.2 4.7 2.8C16.9 7.2 18.5 6 20.7 6 24 6 27 8.5 27 12.8 27 20.4 16 27 16 27z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="8" />
          <path d="M20 20l7 7" />
        </svg>
      );
    case "back":
      return (
        <svg {...common}>
          <path d="M19 7l-9 9 9 9" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M8 8l16 16M24 8L8 24" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path d="M16 4v16M10 10l6-6 6 6M7 18v8h18v-8" />
        </svg>
      );
    case "star":
    case "star-filled":
      return (
        <svg {...common} fill={name === "star-filled" ? "currentColor" : "none"}>
          <path className="star-fill" d="M16 4l3.7 7.6 8.3 1.2-6 5.8 1.4 8.3L16 23l-7.4 3.9L10 18.6l-6-5.8 8.3-1.2z" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" />
          <path d="M16 10v7M16 22v.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M16 6v20M6 16h20" />
        </svg>
      );
  }
}

/** Placeholder bottle shown when there is no photo, in the wine type's colour. */
export function BottleSilhouette({ type }: { type?: string | null }) {
  const fill = type ? `var(--wine-${type})` : "var(--muted-soft)";
  return (
    <svg className="dc-plate__silhouette" viewBox="0 0 40 120" aria-hidden="true">
      <path
        fill={fill}
        d="M16 2h8v4h-1v22c0 4 9 10 9 22v62c0 3-2 6-6 6H14c-4 0-6-3-6-6V50c0-12 9-18 9-22V6h-1z"
      />
    </svg>
  );
}
