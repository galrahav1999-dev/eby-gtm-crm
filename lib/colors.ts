/**
 * Deterministic color for any label, so the same owner/segment/stage always
 * shows the same hue across the app. Gives the UI a lively, consistent feel
 * without hard-coding a palette for values that the team can change at will.
 */
export function labelColor(label: string | null | undefined): string {
  if (!label) return "#64748b"; // slate for empty
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  // Constrain lightness/saturation for the dark UI.
  return `hsl(${h}, 62%, 64%)`;
}

/** Fixed, friendly colors for the (small, stable) set of owners. */
export const OWNER_COLORS: Record<string, string> = {
  Gal: "#6366f1",
  Leah: "#ec4899",
  Mashav: "#22d3ee",
  Michael: "#f59e0b",
};

export function ownerColor(owner: string | null | undefined): string {
  if (!owner) return "#64748b";
  return OWNER_COLORS[owner] ?? labelColor(owner);
}
