# Components guide

How the front end is put together, and every reusable piece with its code location. All primitives are plain React 19 + Tailwind classes + CSS variable tokens. There is no UI library. Import them from `@/components/ui` (barrel) or by file.

## How the front is organized

| Folder | What lives there |
| --- | --- |
| `src/app/` | Routes (`page.tsx`), the root layout, `globals.css` (design tokens, light and dark themes, keyframes, the `.field` focus rule) |
| `src/components/ui/` | Primitives: small, generic, no business knowledge. One file each |
| `src/components/overview/`, `transactions/`, `transfers/` | Feature compositions built from the primitives |
| `src/components/skeletons/` | Loading layouts that mirror the real screens |
| `src/components/AppShell.tsx`, `Toast.tsx`, `PageHeader.tsx`, `icons.tsx` | Shell, notifications, page title, icon set |
| `src/lib/` | Pure logic with unit tests (money, dates, ledger maths, filters, theme helper, motion helpers) |
| `src/state/` | `LedgerProvider`: the in-memory store every screen reads |

Rules of thumb: colours only come from CSS variables (`bg-surface`, `text-text-3`, `border-border` ...), so the dark theme works by swapping variables on `<html data-theme="dark">`. A primitive is only extracted when it is used at least twice or is one clear concept.

## Tokens and theme

Defined in `src/app/globals.css`. `:root` holds the light values, `:root[data-theme="dark"]` the dark ones (taken from the design reference). `src/lib/theme.ts` decides the theme (saved choice, else system) and exports the inline script that sets `data-theme` before first paint. `ThemeToggle` flips it and saves it to `localStorage`.

## Primitives (`src/components/ui/`)

### Button (`Button.tsx`)
The one button. Variants `primary` (solid ink), `accent` (brand green), `secondary` (outlined, default), `ghost`, `danger`. Sizes `md` (44px on phones, 36px desktop) and `sm`.

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `primary / accent / secondary / ghost / danger` | `secondary` |
| `size` | `md / sm` | `md` |
| `loading` | `boolean` (spinner, `aria-busy`, disabled) | `false` |
| native button props | `onClick`, `disabled`, `type`, ref ... | `type="button"` |

```tsx
<Button variant="accent" loading={saving} onClick={save}>Save</Button>
```
`buttonClasses(variant, size)` is exported so other elements can borrow the look. Used in: Transactions toolbar, Transfers form and review, empty state.

### LinkButton (`LinkButton.tsx`)
A Next `Link` with button styling. Same `variant` and `size` props plus all `Link` props.
```tsx
<LinkButton href="/transfers" variant="accent">Transfer</LinkButton>
```
Used in: top bar, Overview hero, "View all" links, transfer success.

### IconButton (`IconButton.tsx`)
Round ghost button with only an icon. `label` is required (becomes `aria-label`). Hide it with breakpoint variants (`desktop:hidden`), not `hidden`.
```tsx
<IconButton label="Close"><Icon name="x" /></IconButton>
```
Used in: sidebar, top bar, drawer close, toast dismiss, theme toggle.

### Card, CardHeader, CardTitle, CardSub (`Card.tsx`)
`Card` takes `as` (`div`, `section`, `aside`, `form`). `CardHeader` is the title row (`flush` removes bottom padding). `CardTitle` is an `h2`. `CardSub` is muted helper text.
```tsx
<Card as="section" aria-labelledby="h"><CardHeader><CardTitle id="h">Accounts</CardTitle></CardHeader></Card>
```
Used in: every Overview, Transfers section.

### Badge, StatusPill, SimTag (`Badge.tsx`)
`Badge` props: `tone` (`success / warning / danger / info / neutral`), `size` (`sm / md / lg`), `dot`, `outlined`. `StatusPill` maps a transaction status to a tone and label. `SimTag` is the square "Simulated" tag.
```tsx
<StatusPill status="pending" />
```
Used in: transactions rows and drawer, Overview recent list, top bar demo badge, Transfers.

### Field (`Field.tsx`)
Label, control, hint and error with correct `aria-describedby` and `aria-invalid`. The control is a render function receiving the wiring props. Ids: error `${id}-err`, hint `${id}-hint`. `FieldError` is the standalone error line.

| Prop | Meaning |
| --- | --- |
| `id`, `label` | control id and label text (`hideLabel` makes it screen reader only) |
| `hint`, `error` | helper text and error message |
| `aside` | right side of the label row (character counter) |
| `className` | replaces the default vertical layout |

```tsx
<Field id="memo" label="Note" error={err}>{(p) => <Input {...p} value={v} onChange={...} />}</Field>
```
Used in: Transfers amount and note, Transactions toolbar.

### Input, SearchInput, AmountInput (`Input.tsx`)
`Input` sizes: `md` (toolbar), `lg` (form), `xl` (amount). `invalid` sets `aria-invalid` and the red border. `SearchInput` is the pill with search icon and optional `trailing` hint. `AmountInput` adds the `$` prefix. All use the `.field` class: ONE border, which turns accent on focus (no outline, no outer ring).
```tsx
<SearchInput id="q" value={q} onChange={...} trailing={<Kbd>Enter</Kbd>} />
```
Used in: top bar search, Transactions toolbar, Transfers.

### Select (`Select.tsx`)
Native select with chevron and the same single-border focus.
```tsx
<Select id="s" value={v} onChange={...}><option value="a">A</option></Select>
```
Used in: Transactions filters.

### SegmentedControl (`SegmentedControl.tsx`)
Group of toggle buttons (`role="group"`, `aria-pressed`). Props: `label`, `options`, `value`, `onChange`.
```tsx
<SegmentedControl label="Overview range" options={RANGE_KEYS} value={range} onChange={setRange} />
```
Used in: Overview range selector.

### Drawer and dialog hooks (`Drawer.tsx`, `useDialog.ts`)
`Drawer` is the right-hand modal in a portal with a fading scrim: focus moves to `initialFocus`, Tab is trapped, Escape closes, page scroll is locked and the rest of the page is inert. The pieces are separate hooks: `useDialogKeys(ref, active, onClose)` (Escape and focus trap) and `useModalLock(active)` (scroll lock and inert).
```tsx
<Drawer labelledBy="title" closeLabel="Close" onClose={close} initialFocus={closeRef}>...</Drawer>
```
Used in: transaction details (Drawer), mobile navigation (`useDialogKeys`).

### Money (`Money.tsx`)
Integer cents to dollars with tabular numerals. `signed` adds +/-, `tone` colours incoming money green, `strike` strikes through (failed).
```tsx
<Money cents={-12500} signed />
```
Used in: transaction rows, drawer, totals, sidebar balances, Transfers.

### DeltaPill (`DeltaPill.tsx`)
Green up or red down change indicator. `<DeltaPill negative={false}>+2.4%</DeltaPill>`. Used in: Overview hero.

### Stat (`Stat.tsx`)
Label, large value, note and optional colour dot. Used in: Overview KPI strip.

### IconTile (`IconTile.tsx`)
Square icon holder. With `color` it is that colour on a 13% tint, otherwise accent-soft. Sizes `sm / md / lg`. Used in: category tiles, account rows, insights, recent rows.

### ListRow (`ListRow.tsx`)
Leading tile, two text lines, right-aligned value; a link when `href` is set. Used in: Overview accounts and recent transactions, Transfers recent list.

### KeyValueList, KeyValueRow (`KeyValue.tsx`)
Definition list rows (label left, value right, optional caption). Used in: drawer details, transfer review, balances panel.

### Notice (`Notice.tsx`)
Inline banner. `tone` `warning` or `danger`, optional `icon` and `role`. Used in: transfer notices, drawer notes, amount filter error.

### EmptyState (`EmptyState.tsx`)
Icon, title, text and an optional action. Used in: Transactions with no matches.

### Pagination (`Pagination.tsx`)
Previous, numbered, next buttons from `pageItems()`. Used in: Transactions.

### Skeleton, SkeletonRegion, ListRowSkeleton (`Skeleton.tsx`)
`Skeleton` is a shimmering block (decorative). `SkeletonRegion` wraps a loading layout as `role="status"` with `aria-busy` and a screen reader "Loading ..." label. Screen skeletons live in `components/skeletons/`.
```tsx
<SkeletonRegion label="accounts"><Skeleton className="h-4 w-24" /></SkeletonRegion>
```

### ThemeToggle (`ThemeToggle.tsx`)
Sun/moon button. Hydration safe, follows system changes until the user chooses. Used in: top bar.

### Avatar, Kbd, Spinner, VisuallyHidden, cn
`Avatar` (initials, `tone`, `shape`), `Kbd` (keyboard hint chip), `Spinner`, `VisuallyHidden` (sr-only text), `cn` (class joiner).

## Feature compositions

| Component | Built from |
| --- | --- |
| `overview/OverviewView`, `BalanceChart` | Card, Stat, SegmentedControl, ListRow, DeltaPill, LinkButton |
| `transactions/TransactionsView`, `TransactionRow`, `SortHeader`, `TransactionDrawer` | Field, SearchInput, Select, Input, Pagination, Drawer, StatusPill, Money, Notice |
| `transfers/TransferFlow`, `Stepper`, `AccountOptions`, `FormSection` | Card, Field, AmountInput, Button, KeyValueRow, Notice |
| `AppShell` | IconButton, Avatar, SearchInput, Kbd, ThemeToggle, Badge, LinkButton |

## Motion

All motion is CSS (`globals.css`): `.enter` fade-up with `--i` stagger (`stagger()` in `lib/motion.ts`), `.animate-*` utilities, skeleton shimmer, success check draw, change flash (`useFlash`). `prefers-reduced-motion: reduce` turns all of it off.
