function parent(element: Element): Element | null {
  const root = element.getRootNode()
  return element.assignedSlot ?? element.parentElement ?? (root as ShadowRoot).host ?? null
}

export function observeAnchorLocale(observer: MutationObserver, anchor: HTMLElement) {
  for (let element: Element | null = anchor; element; element = parent(element))
    observer.observe(element, { attributeFilter: ['lang', 'dir', 'class', 'style'] })
}

export function syncPopupLocale(
  anchor: HTMLElement,
  popup: HTMLElement,
  { lang, dir }: { lang?: string; dir?: string }
) {
  for (
    let element: Element | null = anchor;
    lang === undefined && element;
    element = parent(element)
  )
    lang = element.getAttribute('lang') ?? undefined
  const direction = anchor.ownerDocument.defaultView!.getComputedStyle(anchor).direction
  dir ??= direction
  if (lang === undefined) popup.removeAttribute('lang')
  else if (popup.getAttribute('lang') !== lang) popup.setAttribute('lang', lang)
  if (popup.getAttribute('dir') !== dir) popup.setAttribute('dir', dir)
  return direction === 'rtl'
}
