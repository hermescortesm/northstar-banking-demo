// Icons used only by Transactions (paths from the design reference). Kept local so shared icons.tsx stays untouched.
const PATHS: Record<string, string> = {
  search: "M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M21 21l-4.3-4.3",
  x: "M18 6 6 18 M6 6l12 12",
  check: "M20 6 9 17l-5-5",
  chevUp: "m18 15-6-6-6 6",
  chevDown: "m6 9 6 6 6-6",
  chevRight: "m9 18 6-6-6-6",
  chevLeft: "m15 18-6-6 6-6",
  chevUpDown: "m7 15 5 5 5-5 M7 9l5-5 5 5",
  clock: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 6v6l4 2",
  alert: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 8v4 M12 16h.01",
  info: "M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 16v-4 M12 8h.01",
  trend: "M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6",
  percent: "M19 5 5 19 M4.5 6.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15.5 17.5a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  swap: "M8 3 4 7l4 4 M4 7h16 M16 21l4-4-4-4 M20 17H4",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  code: "m16 18 6-6-6-6 M8 6l-6 6 6 6",
  cloud: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z",
  megaphone: "m3 11 18-5v12L3 14v-3z M11.6 16.8a3 3 0 1 1-5.8-1.6",
  plane:
    "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
  coffee: "M17 8h1a4 4 0 1 1 0 8h-1 M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 2v2 M10 2v2 M14 2v2",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.3 7 12 12l8.7-5 M12 22V12",
  briefcase: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16 M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
  receipt: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8 M12 17.5v-11",
  cpu: "M6 6h12v12H6z M9 9h6v6H9z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4",
  home: "M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

export function TxIcon({ name, size = 18, strokeWidth = 1.75 }: { name: string; size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-none"
    >
      <path d={PATHS[name] ?? PATHS.swap} />
    </svg>
  );
}
