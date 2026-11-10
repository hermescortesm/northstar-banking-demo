import { Icon, isIconName } from "../icons";
import { IconTile } from "../ui/IconTile";
import { CATEGORIES } from "@/lib/data";
import type { Account, Transaction } from "@/lib/types";

/** Table grid shared by the header, rows and the loading skeleton so they line up exactly. */
export const GRID =
  "grid items-center gap-4 px-5 grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)_116px_136px] max-[1180px]:grid-cols-[92px_minmax(0,1.7fr)_minmax(0,1fr)_116px_136px] max-[720px]:grid-cols-[minmax(0,1fr)_auto] max-[720px]:gap-3";

/** Category tile: icon in the category colour on a 13% tint. */
export function CategoryTile({ category, size = "md" }: { category: Transaction["category"]; size?: "md" | "lg" }) {
  const c = CATEGORIES[category] ?? CATEGORIES.Transfer;
  return (
    <IconTile color={c.color} size={size}>
      <Icon name={isIconName(c.icon) ? c.icon : "swap"} size={size === "lg" ? 22 : 18} />
    </IconTile>
  );
}

export function accountLabel(accounts: readonly Account[], id: string): string {
  const a = accounts.find((x) => x.id === id);
  return a ? `${a.shortName} ••${a.mask}` : id;
}
