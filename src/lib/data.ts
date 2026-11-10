import { formatClock, fromDayNumber, isoDate, daysInMonth, toDayNumber, toIso, MONTHS_SHORT, MONTHS_LONG } from "./dates";
import type { Account, AccountId, CategoryName, LedgerState, Transaction, TransactionStatus } from "./types";

/** Fixed demo "today" (Monday). Nothing in the dataset is dated after it. */
export const TODAY_ISO = "2026-11-09";
export const TODAY: number = toDayNumber(TODAY_ISO);
export const SEED = 20261109;
export const MEMO_MAX = 60;

export const CATEGORIES: Readonly<Record<CategoryName, { color: string; icon: string }>> = {
  Revenue: { color: "#0E8A80", icon: "trend" },
  Interest: { color: "#3E9B6E", icon: "percent" },
  Transfer: { color: "#6B7A90", icon: "swap" },
  Payroll: { color: "#3B5B8C", icon: "users" },
  Rent: { color: "#C47A2C", icon: "home" },
  "Cloud & Infra": { color: "#2F8FC5", icon: "cloud" },
  Software: { color: "#6D63C9", icon: "code" },
  Contractors: { color: "#4E9F75", icon: "briefcase" },
  Marketing: { color: "#C2577A", icon: "megaphone" },
  Travel: { color: "#8A9A3B", icon: "plane" },
  Meals: { color: "#B08A3E", icon: "coffee" },
  Office: { color: "#7A8796", icon: "box" },
  Equipment: { color: "#9A6B4F", icon: "cpu" },
  Insurance: { color: "#8C6BB1", icon: "shield" },
  Taxes: { color: "#A35D4A", icon: "receipt" },
};
export const CATEGORY_NAMES = Object.keys(CATEGORIES) as CategoryName[];

const ACCOUNT_DEFS = [
  { id: "op", name: "Operating Checking", shortName: "Operating", type: "Checking", mask: "4821", target: 84261538 },
  { id: "pr", name: "Payroll Checking", shortName: "Payroll", type: "Checking", mask: "1956", target: 21488000 },
  { id: "rs", name: "Reserve Savings", shortName: "Reserve", type: "Savings", mask: "7730", target: 156240971, apy: "4.05% APY" },
] as const;

const CARD_MASK = { c1: "4417", c2: "5520", c3: "9032", c4: "2265" } as const;
type CardKey = keyof typeof CARD_MASK;

interface Raw {
  n: number;
  mer: string;
  desc: string;
  cat: CategoryName;
  amt: number;
  acct: AccountId;
  method: string;
  card?: CardKey;
  status?: TransactionStatus;
  reason?: string;
  payout?: boolean;
}

function bizDay(y: number, m: number, d: number, back: boolean): number {
  let n = toDayNumber(isoDate(y, m, d));
  const w = fromDayNumber(n).weekday;
  if (w === 6) n += back ? -1 : 2;
  else if (w === 0) n += back ? -2 : 1;
  return n;
}

/** Deterministic mulberry32 PRNG; only used to pick integers. */
function makeRng(seed: number) {
  let s = seed;
  return function rnd(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

export const TXN_ID_PREFIX = "txn_";
export const txnId = (seq: number) => TXN_ID_PREFIX + pad4(seq);

function buildRaw(rnd: () => number): Raw[] {
  const rc = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1)); // integer cents in [lo, hi]
  const scale = (c: number, pct: number) => Math.floor((c * pct) / 100);
  const raw: Raw[] = [];
  const add = (n: number, mer: string, desc: string, cat: CategoryName, amt: number, acct: AccountId, method: string, ex?: Partial<Raw>) => {
    raw.push({ n, mer, desc, cat, amt, acct, method, ...ex });
  };
  const CUST = ["Halvorsen Logistics", "Brightline Freight Co.", "Cascade Cold Storage", "Meridian Grocers", "Portside Distribution", "Keystone 3PL"];
  const POOL: [string, CategoryName, number, number, string][] = [
    ["Blue Bottle Coffee", "Meals", 1800, 6400, "Team coffee"],
    ["Sweetgreen", "Meals", 4200, 18000, "Team lunch"],
    ["DoorDash", "Meals", 6000, 34000, "Late build night · team dinner"],
    ["United Airlines", "Travel", 38000, 124000, "SFO → ORD · customer site visit"],
    ["Delta Air Lines", "Travel", 42000, 98000, "SFO → ATL · pilot rollout"],
    ["Hilton Chicago", "Travel", 54000, 132000, "Customer onsite · 3 nights"],
    ["Uber", "Travel", 2400, 9600, "Airport ride"],
    ["Amazon Business", "Office", 8000, 92000, "Office supplies"],
    ["Uline", "Office", 14000, 64000, "Shipping materials"],
    ["Digi-Key Electronics", "Equipment", 22000, 240000, "Sensor components"],
    ["McMaster-Carr", "Equipment", 12000, 160000, "Fasteners & hardware"],
  ];
  const cutoff = toDayNumber("2026-11-04");
  let inv = 2101;
  let po = 88410;
  for (let i = 0; i < 13; i++) {
    const m0 = 10 + i;
    const y = 2025 + Math.floor(m0 / 12);
    const m = (m0 % 12) + 1;
    const nd = daysInMonth(y, m);
    const gp = 82 + 3 * i;
    const prevM = m === 1 ? 12 : m - 1;
    const prevDim = daysInMonth(m === 1 ? y - 1 : y, prevM);
    const day = (d: number) => toDayNumber(isoDate(y, m, d));
    add(day(1), "Harbor Point Properties", "Office lease · 2201 Harrison St, Suite 400", "Rent", -1840000, "op", "Wire");
    for (const [d0, back] of [[1, false], [15, true]] as const) {
      const n = bizDay(y, m, d0, back);
      const amt = rc(8600000 + i * 115000, 8790000 + i * 115000);
      const per = d0 === 1 ? `Pay period ${MONTHS_SHORT[prevM - 1]} 16-${prevDim}` : `Pay period ${MONTHS_SHORT[m - 1]} 1-15`;
      add(n, "Transfer to Payroll ••1956", `Payroll funding · ${per}`, "Transfer", -amt, "op", "Internal transfer");
      add(n, "Transfer from Operating ••4821", `Payroll funding · ${per}`, "Transfer", amt, "pr", "Internal transfer");
      add(n, "Gusto", `Payroll · ${per}`, "Payroll", -amt, "pr", "ACH");
    }
    const seats = 22 + Math.floor(i / 3);
    add(day(3), "Amazon Web Services", `AWS usage · ${MONTHS_LONG[prevM - 1]}`, "Cloud & Infra", -rc(1780000 + i * 62000, 2020000 + i * 62000), "op", "Card", { card: "c3" });
    add(day(20), "Vercel", "Pro team · hosting", "Cloud & Infra", -rc(98000, 124000), "op", "Card", { card: "c3" });
    add(day(22), "OpenAI", "API usage", "Cloud & Infra", -rc(140000 + i * 12000, 190000 + i * 12000), "op", "Card", { card: "c3" });
    add(day(25), "Datadog", "Infrastructure monitoring", "Cloud & Infra", -rc(260000 + i * 6000, 300000 + i * 6000), "op", "Card", { card: "c3" });
    add(day(5), "Google Workspace", `Business Standard · ${seats} seats`, "Software", -seats * 1440, "op", "Card", { card: "c2" });
    add(day(8), "Figma", "Organization plan", "Software", -90000, "op", "Card", { card: "c2" });
    add(day(10), "Linear", `Business plan · ${seats} seats`, "Software", -seats * 1400, "op", "Card", { card: "c2" });
    add(day(12), "GitHub", "Team plan · Actions minutes", "Software", -rc(118000, 142000), "op", "Card", { card: "c2" });
    add(day(14), "Notion", "Business plan", "Software", -64000, "op", "Card", { card: "c2" });
    add(day(18), "Slack", "Business+ plan", "Software", -rc(138000, 152000), "op", "Card", { card: "c2" });
    for (const d of [6, 21]) {
      const n = day(d);
      if (n < cutoff) add(n, "Google Ads", "Search campaigns · warehouse automation", "Marketing", -rc(scale(380000, gp), scale(540000, gp)), "op", "Card", { card: "c4" });
    }
    if (day(16) < cutoff) add(day(16), "LinkedIn Ads", "Sponsored content · ops leaders", "Marketing", -rc(260000, 440000), "op", "Card", { card: "c4" });
    add(day(18), "Kestrel Design Studio", "Brand & product design retainer", "Contractors", -1250000, "op", "ACH");
    if (y === 2026 && m === 10) {
      add(day(26), "Northwind Firmware LLC", "Firmware development · Oct milestone", "Contractors", -1124000, "op", "ACH", {
        status: "failed",
        reason: "Returned by the receiving bank · R03 (no account / unable to locate). Resent Oct 28 with corrected details.",
      });
      add(day(28), "Northwind Firmware LLC", "Firmware development · Oct milestone (resent)", "Contractors", -1124000, "op", "ACH");
    } else {
      add(day(26), "Northwind Firmware LLC", `Firmware development · ${MONTHS_SHORT[m - 1]} milestone`, "Contractors", -rc(800000, 1400000), "op", "ACH");
    }
    add(day(20), "Vouch Insurance", "BOP & D&O premium", "Insurance", -214000, "op", "ACH");
    add(day(27), "Jamie Ortiz", "Field service · site installs", "Contractors", -rc(320000, 560000), "op", "ACH");
    for (let d = 1; d <= nd; d++) {
      const n2 = day(d);
      if (fromDayNumber(n2).weekday === 4) add(n2, "Stripe", `Payout · po_${po++}`, "Revenue", rc(scale(3600000, gp), scale(5000000, gp)), "op", "ACH", { payout: true });
    }
    [9, 23].forEach((dd, k) => {
      add(day(dd), CUST[(i * 2 + k) % 6], `Invoice INV-${inv++} · Fleet subscription`, "Revenue", rc(scale(2200000, gp), scale(6000000, gp)), "op", "ACH");
    });
    add(day(nd), "Northstar Banking", "Interest earned · Reserve Savings (simulated rate)", "Interest", rc(510000 + i * 1800, 518000 + i * 1800), "rs", "Interest");
    const cnt = 8 + Math.floor(rnd() * 3);
    for (let k = 0; k < cnt; k++) {
      const p = POOL[Math.floor(rnd() * POOL.length)];
      const dd2 = 1 + Math.floor(rnd() * nd);
      add(day(dd2), p[0], p[4], p[1], -rc(p[2], p[3]), "op", "Card", { card: "c1" });
    }
  }
  add(toDayNumber("2026-01-12"), "Apple", "MacBook Pro × 2 · new hires", "Equipment", -864000, "op", "Card", { card: "c1" });
  add(toDayNumber("2026-03-02"), "Delaware Division of Corporations", "Annual franchise tax & report", "Taxes", -45000, "op", "ACH");
  add(toDayNumber("2026-04-15"), "California Franchise Tax Board", "Form 100 · minimum franchise tax", "Taxes", -80000, "op", "ACH");
  add(toDayNumber("2026-07-01"), "Transfer to Operating ••4821", "Working capital top-up", "Transfer", -20000000, "rs", "Internal transfer");
  add(toDayNumber("2026-07-01"), "Transfer from Reserve ••7730", "Working capital top-up", "Transfer", 20000000, "op", "Internal transfer");
  add(toDayNumber("2026-09-14"), "Atlas Port Authority", "Annual fleet license · PO 77-1180", "Revenue", 12840000, "op", "Wire");
  add(toDayNumber("2026-11-06"), "Google Ads", "Search campaigns · warehouse automation", "Marketing", -438000, "op", "Card", {
    card: "c4",
    status: "failed",
    reason: "Declined: this card was frozen on Nov 4.",
  });
  add(TODAY, "Stripe", `Payout · po_${po++} · arrives Nov 10`, "Revenue", 4621840, "op", "ACH", { payout: true });
  return raw;
}

function buildSeedTransactions(): Transaction[] {
  const rnd = makeRng(SEED);
  const raw = buildRaw(rnd).filter((o) => o.n <= TODAY); // nothing dated in the future
  raw.sort((a, b) => a.n - b.n); // stable
  return raw.map((o, idx) => {
    const seq = idx + 1;
    const bank = o.method !== "Card";
    const hh = bank ? 5 + Math.floor(rnd() * 5) : 8 + Math.floor(rnd() * 13);
    const mm = Math.floor(rnd() * 60);
    let status: TransactionStatus = o.status ?? "completed";
    if (!o.status && o.n >= TODAY - 1 && (o.card || (o.amt > 0 && o.method === "ACH"))) status = "pending";
    const iso = toIso(o.n);
    return {
      id: txnId(seq),
      seq,
      accountId: o.acct,
      date: iso,
      day: o.n,
      minutes: hh * 60 + mm,
      time: formatClock(hh, mm),
      merchant: o.mer,
      description: o.desc,
      category: o.cat,
      amountCents: o.amt,
      direction: o.amt > 0 ? "in" : "out",
      status,
      method: o.card ? `Debit card ••${CARD_MASK[o.card]}` : o.method === "Interest" ? "Interest credit" : o.method,
      reference: `NS-${iso.replace(/-/g, "").slice(2)}-${1000 + seq}`,
      reason: o.reason ?? null,
      payout: !!o.payout,
      simulated: false,
      transferId: null,
    } satisfies Transaction;
  });
}

/** Newest first, same ordering rule as the design. */
export function compareTransactionsDesc(a: Transaction, b: Transaction): number {
  return b.day - a.day || b.minutes - a.minutes || b.seq - a.seq;
}

/** Builds the full deterministic dataset. Identical on every call. */
export function createInitialLedgerState(): LedgerState {
  const seed = buildSeedTransactions();
  const accounts: Account[] = ACCOUNT_DEFS.map((a) => {
    const completed = seed.reduce((s, t) => (t.status === "completed" && t.accountId === a.id ? s + t.amountCents : s), 0);
    const base: Account = {
      id: a.id,
      name: a.name,
      shortName: a.shortName,
      type: a.type,
      mask: a.mask,
      openingBalanceCents: a.target - completed,
    };
    return "apy" in a ? { ...base, apy: a.apy } : base;
  });
  return {
    accounts,
    transactions: seed.slice().sort(compareTransactionsDesc),
    transfers: [],
    nextTransactionSeq: seed.length + 1,
    nextTransferSeq: 1,
    appliedRequestIds: [],
  };
}
