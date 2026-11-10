// Inline stroke icons (paths copied from the design reference).
const PATHS = {
  overview: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  transactions: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  swap: "M8 3 4 7l4 4 M4 7h16 M16 21l4-4-4-4 M20 17H4",
  search: "M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M21 21l-4.3-4.3",
  x: "M18 6 6 18 M6 6l12 12",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  panel: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 3v18",
  check: "M20 6 9 17l-5-5",
  alert: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 8v4 M12 16h.01",
  chevLeft: "m15 18-6-6 6-6",
  chevRight: "m9 18 6-6-6-6",
  arrowRight: "M5 12h14 M12 5l7 7-7 7",
  info:"M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 16v-4 M12 8h.01",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: 14 | 16 | 18 | 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
