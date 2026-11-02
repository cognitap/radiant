// Native scroll containers draw ScrollArea's thumb on a clear track, like an overlay bar.
// Forced colors ignore scrollbar-color, so system scrollbars return there.
export const scrollbarClass =
  '[scrollbar-color:color-mix(in_oklch,var(--rad-scroll-area-thumb-color,var(--rad-color-muted-foreground,oklch(0.45_0.01_286)))_45%,transparent)_transparent]'
