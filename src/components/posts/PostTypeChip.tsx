/**
 * The offer/request chip.
 *
 * Shared rather than repeated because three pages show this label — board
 * card, post page, dashboard — and a signal that means one thing on the
 * board and another on the dashboard is worse than no signal.
 *
 * Filled pill rather than coloured text: coloured text at 11px was
 * measurably correct (6.65:1 and 7.66:1) and still invisible, because the
 * eye reads lightness before hue and a few dozen tinted pixels don't carry
 * one. A filled background is the same idiom as the search tags
 * (bg-fg text-bg rounded-full), just typed by colour.
 *
 * Paper text on the colour, not the other way round: #EDE8E0 on #2E5A16 and
 * #164A70 keeps those same ratios, inverted.
 */
export function PostTypeChip({ type, label }: { type: string; label: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bg ${
        type === "OFFER" ? "bg-offer" : "bg-request"
      }`}
    >
      {label}
    </span>
  );
}
