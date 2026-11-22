'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Cascading listboxes own active descendants and branch indicators. */

import { useRef, type KeyboardEvent } from 'react'
import { cn } from 'cn'
import { matchSelectText, moveSelectFocus } from '../../internal/select.js'
import { useLocaleMatcher } from '../../react/useLocale.js'
import type { PartStyle } from '../../presentation.js'
import { selectItemClass } from '../Select/selectStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'
import type { TreeNode } from '../Tree/treeModel.js'

export function isCascaderBranch(node: TreeNode) {
  return node.branch || !!node.item.loadChildren
}

type CascaderColumnProps = {
  id: string
  items: TreeNode[]
  label?: string
  labelledBy?: string
  heading?: string
  parent?: TreeNode
  selected?: string
  current?: string
  focused: boolean
  loadingText: string
  errorText: string
  emptyText: string
  part?: PartStyle
  onMove(value: string): void
  onBack(): void
  onActivate(node: TreeNode): void
  onRetry(): void
}

export function CascaderColumn({
  id,
  items,
  label,
  labelledBy,
  heading,
  parent,
  selected,
  current,
  focused,
  loadingText,
  errorText,
  emptyText,
  part,
  onMove,
  onBack,
  onActivate,
  onRetry
}: CascaderColumnProps) {
  const matcher = useLocaleMatcher()
  const search = useRef({ text: '', time: 0 })
  const active =
    items.find(item => !item.disabled && item.value === (current ?? selected)) ??
    items.find(item => !item.disabled)
  const pending = !!parent?.item.loadChildren && (!parent.load || parent.load.status === 'loading')
  const failed = parent?.load?.status === 'error'
  const status = pending ? loadingText : failed ? errorText : emptyText
  const statusId = id + '-status'
  const activeId = active ? id + '-' + active.position : failed ? statusId : undefined

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
    const element = event.currentTarget
    const view = element.ownerDocument.defaultView!
    const back = view.getComputedStyle(element).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const forward = back === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
    const { key } = event
    if (key === back) {
      event.preventDefault()
      onBack()
      return
    }
    if (key === forward || key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (active && (key !== forward || isCascaderBranch(active))) onActivate(active)
      else if (failed && key !== forward) onRetry()
      return
    }
    let next: string | undefined
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Home' || key === 'End') {
      next = moveSelectFocus(items, active?.value ?? null, key)
    } else if (matcher.isSingleKey(key)) {
      const time = view.performance.now()
      search.current = {
        time,
        text: (time - search.current.time > 700 ? '' : search.current.text) + key
      }
      next = matchSelectText(items, search.current.text, active?.value ?? null, matcher)
    } else {
      return
    }
    event.preventDefault()
    if (next !== undefined) onMove(next)
  }

  return (
    <div className="@container/cascader-column [contain-intrinsic-inline-size:var(--_rad-cascader-column-width)] w-[length:var(--_rad-cascader-column-width)] min-w-28 flex-1 border-e border-[var(--rad-color-border)] last:border-e-0">
      {heading && (
        <div
          id={id + '-heading'}
          className="px-2 py-1.5 text-xs font-semibold [color:var(--rad-color-muted-foreground)] @min-[10rem]/cascader-column:px-3"
        >
          {heading}
        </div>
      )}
      <div
        role="listbox"
        tabIndex={focused ? 0 : -1}
        aria-label={heading ? undefined : label}
        aria-labelledby={heading ? id + '-heading' : labelledBy}
        aria-activedescendant={activeId}
        aria-busy={pending || undefined}
        data-slot="cascader-column"
        className={cn(
          'group/cascader max-h-[min(18rem,calc(100dvh-4rem))] overflow-y-auto overscroll-contain px-1 focus:outline-none',
          scrollbarClass,
          part?.className
        )}
        style={part?.style}
        onKeyDown={navigate}
        onBlur={() => {
          search.current = { time: 0, text: '' }
        }}
        onClick={event => {
          const option = (event.target as Element).closest<HTMLElement>('[role="option"]')
          if (!option || option.getAttribute('aria-disabled') === 'true') return
          event.currentTarget.focus({ preventScroll: true })
          const item = items.find(node => node.value === option.dataset.value)
          if (item) onActivate(item)
          else if (failed) onRetry()
        }}
      >
        {items.length ? (
          items.map(item => {
            const branch = isCascaderBranch(item)
            return (
              <div
                key={item.value}
                id={id + '-' + item.position}
                role="option"
                aria-selected={!item.disabled && item.value === selected}
                aria-disabled={item.disabled || undefined}
                data-slot="cascader-option"
                data-value={item.value}
                data-selected={!item.disabled && item.value === selected ? '' : undefined}
                data-disabled={item.disabled ? '' : undefined}
                data-active={item.value === active?.value ? '' : undefined}
                className={cn(
                  selectItemClass,
                  '@max-[10rem]/cascader-column:gap-1 @max-[10rem]/cascader-column:px-2 not-data-disabled:cursor-pointer not-data-disabled:hover:bg-[var(--rad-color-neutral)] group-focus-visible/cascader:data-active:[outline:2px_solid_var(--rad-color-focus)] group-focus-visible/cascader:data-active:outline-offset-[-2px] group-focus-visible/cascader:forced-colors:data-active:outline-[Highlight]'
                )}
              >
                {item.item.icon && (
                  <span
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    {item.item.icon}
                  </span>
                )}
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.textValue}</span>
                {branch && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 rtl:rotate-180"
                  >
                    ›
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <div
            id={statusId}
            role="option"
            aria-selected={false}
            aria-disabled={!failed || undefined}
            data-slot="cascader-status"
            data-active=""
            className={cn(
              selectItemClass,
              failed ? 'cursor-pointer underline' : '[color:var(--rad-color-muted-foreground)]',
              '@max-[10rem]/cascader-column:px-2 group-focus-visible/cascader:[outline:2px_solid_var(--rad-color-focus)] group-focus-visible/cascader:outline-offset-[-2px]'
            )}
          >
            {status}
          </div>
        )}
      </div>
      {parent?.item.loadChildren && (
        <output className="sr-only">{items.length ? '' : status}</output>
      )}
    </div>
  )
}
