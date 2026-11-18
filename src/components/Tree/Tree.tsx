'use client'
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Tree groups are owned by tree items. */

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type KeyboardEvent
} from 'react'
import { cn } from 'cn'
import { requireAccessibleName, type AccessibleName } from '../../internal/accessibleName.js'
import { composeAction } from '../../internal/events.js'
import { joinIds } from '../../internal/ids.js'
import { nextSelection, sameSelection, type Selection } from '../../internal/selection.js'
import { matchSelectText } from '../../internal/select.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import { useLocaleMatcher } from '../../react/useLocale.js'
import type { StateOwner, ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import {
  branchChecks,
  buildTree,
  selectableLeaves,
  visibleTree,
  type TreeItem,
  type TreeNode
} from './treeModel.js'
import { useTreeLoading } from './useTreeLoading.js'
import { focusRingClass } from '../shared/focusStyles.js'
import { scrollbarClass } from '../shared/scrollbarStyles.js'

export type { TreeItem } from './treeModel.js'

export type TreeVirtual = {
  /** Scroll viewport height in pixels. */
  height: number
  /** Fixed row height in pixels. Labels use one line. */
  rowHeight: number
}

type TreeSelection<Value> = ValueOwner<Value> & { onValueChange?: (value: Value) => void }

export type TreeProps = AccessibleName &
  Omit<
    ComponentProps<'div'>,
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'role'
    | 'tabIndex'
    | 'style'
    | 'contentEditable'
    | 'defaultValue'
  > &
  StateOwner<'expanded', string[]> & {
    items: readonly TreeItem[]
    onExpandedChange?: (expanded: string[]) => void
    loadingText?: string
    /** Displayed on an expanded branch whose load failed. Enter retries the load. */
    errorText?: string
    virtual?: TreeVirtual
    style?: ThemeStyle
    'data-slot'?: string
  } & (
    | ({ type?: 'single'; checkboxes?: never } & TreeSelection<string | null>)
    | ({ type: 'multiple'; checkboxes?: boolean } & TreeSelection<string[]>)
  )

const rowClass =
  'box-border flex min-h-8 items-center gap-2 rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)] py-1 pe-2 data-disabled:opacity-[var(--rad-state-disabled-opacity,0.5)] not-data-disabled:cursor-pointer not-data-disabled:hover:bg-[var(--rad-color-neutral)] data-selected:bg-[var(--rad-control-selected-background,var(--rad-color-neutral))] data-selected:font-semibold data-selected:[color:var(--rad-control-selected-foreground,var(--rad-color-foreground))] group-focus-visible/tree:data-active:[outline:2px_solid_var(--rad-color-focus)] group-focus-visible/tree:data-active:outline-offset-[-2px] group-focus-visible/tree:forced-colors:data-active:outline-[Highlight] forced-colors:data-selected:underline'

function treeValues(value: Selection, multiple: boolean, name: string) {
  if (
    multiple
      ? !Array.isArray(value) ||
        new Set(value).size !== value.length ||
        value.some(item => typeof item !== 'string' || !item)
      : value !== null && (typeof value !== 'string' || !value)
  )
    throw new TypeError(`Tree ${name} must match its mode and contain unique, nonempty values.`)
}

export function Tree(props: TreeProps) {
  const {
    items,
    type = 'single',
    checkboxes = false,
    value,
    defaultValue,
    onValueChange: _onValueChange,
    expanded,
    defaultExpanded,
    onExpandedChange,
    loadingText = 'Loading…',
    errorText = 'Could not load. Press Enter to retry.',
    virtual,
    ref,
    className,
    onScroll,
    onKeyDown,
    onClick,
    onFocus,
    onBlur,
    ...host
  } = props
  requireAccessibleName('Tree', host)
  const [initialType] = useState(type)
  if (type !== initialType)
    throw new TypeError('Tree cannot change its selection type after mount.')
  if (checkboxes && type !== 'multiple')
    throw new TypeError('Tree checkboxes require multiple selection.')
  if (
    virtual &&
    (![virtual.height, virtual.rowHeight].every(Number.isFinite) ||
      virtual.height <= 0 ||
      virtual.rowHeight <= 0)
  )
    throw new RangeError('Tree virtual height and rowHeight must be positive finite numbers.')

  const selection = useControllableState<Selection>({
    name: 'Tree value',
    value,
    defaultValue,
    initialValue: type === 'multiple' ? [] : null,
    equal: sameSelection,
    onChange: next => {
      if (props.type === 'multiple') {
        if (Array.isArray(next)) props.onValueChange?.(next)
      } else if (!Array.isArray(next)) props.onValueChange?.(next)
    }
  })
  const expansion = useControllableState<string[]>({
    name: 'Tree expanded',
    value: expanded,
    defaultValue: defaultExpanded,
    initialValue: [],
    onChange: onExpandedChange,
    equal: sameSelection
  })
  treeValues(selection.value, type === 'multiple', 'selection')
  treeValues(expansion.value, true, 'expansion')

  const { loads, load } = useTreeLoading(items)
  const model = useMemo(() => buildTree(items, loads), [items, loads])
  const openItems = useMemo(() => new Set(expansion.value), [expansion.value])
  const rows = useMemo(() => visibleTree(model.roots, openItems), [model, openItems])
  const byRow = useMemo(() => new Map(rows.map((node, index) => [node.value, index])), [rows])
  const enabled = useMemo(() => rows.filter(node => !node.disabled), [rows])
  const selected = useMemo(() => {
    const current = selection.value
    return new Set(Array.isArray(current) ? current : current === null ? [] : [current])
  }, [selection.value])
  const checked = useMemo(
    () => (checkboxes ? branchChecks(model.roots, selected) : null),
    [checkboxes, model, selected]
  )
  const [focused, setFocused] = useState<string | null>(null)
  let cursor = focused === null ? undefined : model.byValue.get(focused)
  while (cursor && (cursor.disabled || !byRow.has(cursor.value)))
    cursor = cursor.parent ?? undefined
  const active = cursor ?? enabled.find(node => selected.has(node.value)) ?? enabled[0]
  const activeIndex = active ? byRow.get(active.value)! : -1
  if (focused !== null && active?.value !== focused) setFocused(active?.value ?? null)
  const root = useRef<HTMLDivElement>(null)
  const hostRef = useComposedRefs(ref, root)
  const id = useId()
  const matcher = useLocaleMatcher()
  const search = useRef({ text: '', time: 0 })
  const [scrollTop, setScrollTop] = useState(0)
  const rowHeight = virtual?.rowHeight ?? 0
  const height = virtual?.height ?? 0
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const element = root.current
    if (!element || !rowHeight) return
    const update = () => setMeasuredHeight(element.clientHeight)
    const observer = new element.ownerDocument.defaultView!.ResizeObserver(update)
    observer.observe(element)
    update()
    return () => observer.disconnect()
  }, [rowHeight])

  useEffect(() => {
    for (const node of rows) {
      if (
        !node.disabled &&
        openItems.has(node.value) &&
        (!node.load || node.load.status === 'loading')
      )
        load(node)
    }
  }, [rows, openItems, load])
  useEffect(() => {
    search.current = { text: '', time: 0 }
  }, [matcher])
  const reveal = useCallback(
    (index: number) => {
      const element = root.current
      if (!element || index < 0) return
      if (!rowHeight) {
        const row = element.querySelector('[data-active] > [data-slot="tree-row"]')
        row?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        return
      }
      const start = index * rowHeight
      const end = start + rowHeight
      const visibleHeight = element.clientHeight
      if (start < element.scrollTop || rowHeight > visibleHeight) element.scrollTop = start
      else if (end > element.scrollTop + visibleHeight) element.scrollTop = end - visibleHeight
      setScrollTop(element.scrollTop)
    },
    [rowHeight]
  )
  useEffect(() => {
    const element = root.current
    if (element && element.ownerDocument.activeElement === element) reveal(activeIndex)
  }, [activeIndex, reveal, measuredHeight])

  function toggle(node: TreeNode) {
    if (node.branch) {
      expansion.request(values =>
        openItems.has(node.value)
          ? values.filter(value => value !== node.value)
          : [...values, node.value]
      )
    }
  }

  function select(node: TreeNode) {
    if (checked) {
      const leaves = selectableLeaves(node)
      if (!leaves.length) return
      selection.request(values => {
        const next = new Set(Array.isArray(values) ? values : [])
        const complete = leaves.every(value => next.has(value))
        for (const value of leaves) {
          if (complete) next.delete(value)
          else next.add(value)
        }
        return [...next]
      })
    } else {
      selection.request(current =>
        nextSelection(current, node.value, type === 'single' || !selected.has(node.value))
      )
    }
  }

  function activate(node: TreeNode) {
    if (node.load?.status === 'error' && openItems.has(node.value)) load(node)
    else select(node)
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !active ||
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    )
      return
    const view = event.currentTarget.ownerDocument.defaultView!
    const rtl = view.getComputedStyle(event.currentTarget).direction === 'rtl'
    const index = enabled.indexOf(active)
    let destination: TreeNode | undefined
    switch (event.key) {
      case 'ArrowDown':
        destination = enabled[index + 1]
        break
      case 'ArrowUp':
        destination = enabled[index - 1]
        break
      case 'Home':
        destination = enabled[0]
        break
      case 'End':
        destination = enabled.at(-1)
        break
      case rtl ? 'ArrowLeft' : 'ArrowRight':
        if (openItems.has(active.value))
          destination = active.children.find(child => !child.disabled)
        else toggle(active)
        break
      case rtl ? 'ArrowRight' : 'ArrowLeft':
        if (active.branch && openItems.has(active.value)) toggle(active)
        else destination = active.parent ?? undefined
        break
      case 'Enter':
        activate(active)
        break
      case ' ':
        select(active)
        break
      default: {
        if (!matcher.isSingleKey(event.key)) return
        const now = view.performance.now()
        search.current.text =
          (now - search.current.time > 700 ? '' : search.current.text) + event.key
        search.current.time = now
        const match = matchSelectText(enabled, search.current.text, active.value, matcher)
        destination = match === undefined ? undefined : model.byValue.get(match)
      }
    }
    event.preventDefault()
    if (destination) setFocused(destination.value)
  }

  // Keep the active descendant mounted while the viewport is scrolled independently of focus.
  const start = virtual ? Math.max(0, Math.floor(scrollTop / rowHeight) - 3) : 0
  const end = virtual
    ? Math.min(rows.length, Math.ceil((scrollTop + (measuredHeight ?? height)) / rowHeight) + 3)
    : rows.length
  const windowed = rows.slice(start, end)
  if (virtual && active && activeIndex < start) windowed.unshift(active)
  if (virtual && active && activeIndex >= end) windowed.push(active)

  function itemId(node: TreeNode) {
    const suffix = Array.from(node.value, character => character.codePointAt(0)!.toString(36))
    return `${id}-${suffix.join('-')}`
  }

  function renderRow(node: TreeNode): ReactElement {
    const index = byRow.get(node.value)!
    const rowId = itemId(node)
    const groupId = rowId + '-children'
    const open = openItems.has(node.value)
    const hasGroup = !virtual && open && node.children.length > 0
    const check = checked?.get(node.value)
    const chosen = checked ? check === true : selected.has(node.value)
    const status =
      open && node.load?.status === 'loading'
        ? loadingText
        : open && node.load?.status === 'error'
          ? errorText
          : undefined
    return (
      <Fragment key={node.value}>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- Tree owns focus via aria-activedescendant. */}
        <div
          role="treeitem"
          id={rowId}
          aria-labelledby={joinIds(rowId + '-label', status ? rowId + '-status' : undefined)}
          aria-owns={hasGroup ? groupId : undefined}
          aria-level={node.level}
          aria-posinset={node.position}
          aria-setsize={node.size}
          aria-expanded={node.branch ? open : undefined}
          aria-busy={open && node.load?.status === 'loading' ? true : undefined}
          aria-disabled={node.disabled || undefined}
          aria-selected={checked || node.disabled ? undefined : chosen}
          aria-checked={check}
          data-slot="tree-item"
          data-value={node.value}
          data-active={node === active ? '' : undefined}
          className={virtual ? 'absolute inset-x-0' : undefined}
          style={virtual ? { top: index * rowHeight, height: rowHeight } : undefined}
        >
          <div
            data-slot="tree-row"
            data-active={node === active ? '' : undefined}
            data-disabled={node.disabled ? '' : undefined}
            data-selected={chosen ? '' : undefined}
            className={cn(rowClass, virtual && 'h-full min-h-0 overflow-hidden py-0')}
            style={{
              paddingInlineStart: `calc(0.5rem + ${node.level - 1} * var(--rad-tree-indent, 1.25rem))`
            }}
          >
            <span
              aria-hidden="true"
              data-slot={node.branch ? 'tree-disclosure' : undefined}
              className="grid min-h-6 w-6 shrink-0 place-items-center"
            >
              {node.branch && (
                <span
                  className={cn(
                    'block size-2 border-e border-t border-current',
                    open ? 'rotate-[135deg] rtl:rotate-[-135deg]' : 'rotate-45 rtl:-rotate-45'
                  )}
                />
              )}
            </span>
            {check !== undefined ? (
              <span
                aria-hidden="true"
                data-slot="tree-checkbox"
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-sm border border-[var(--rad-color-border)] text-xs leading-none forced-colors:border-[CanvasText]',
                  check && 'bg-[var(--rad-color-accent)] [color:var(--rad-color-accent-foreground)]'
                )}
              >
                {check === 'mixed' ? '−' : check ? '✓' : ''}
              </span>
            ) : checkboxes ? (
              <span
                aria-hidden="true"
                className="size-4 shrink-0"
              />
            ) : null}
            {node.item.icon && (
              <span
                aria-hidden="true"
                className="shrink-0"
              >
                {node.item.icon}
              </span>
            )}
            <span
              id={rowId + '-label'}
              className={cn('min-w-0', virtual && 'truncate')}
            >
              {node.item.label}
            </span>
            <output
              id={rowId + '-status'}
              className="ms-auto min-w-0 truncate text-xs [color:var(--rad-color-muted-foreground)]"
            >
              {status}
            </output>
          </div>
        </div>
        {hasGroup && (
          <div
            role="group"
            id={groupId}
          >
            {node.children.map(renderRow)}
          </div>
        )}
      </Fragment>
    )
  }

  return (
    <div
      {...host}
      ref={hostRef}
      role="tree"
      tabIndex={0}
      contentEditable={undefined}
      dangerouslySetInnerHTML={undefined}
      aria-multiselectable={type === 'multiple' || undefined}
      aria-activedescendant={active ? itemId(active) : undefined}
      data-slot={joinIds('tree', host['data-slot'])}
      className={cn(
        'group/tree min-w-0 rounded-[var(--rad-control-radius,0.5rem)] [color:var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-sm',
        active ? 'focus-visible:outline-none' : focusRingClass,
        virtual && scrollbarClass,
        virtual && 'w-72 max-w-full overflow-y-auto overscroll-contain',
        className
      )}
      style={{ ...(virtual && { height }), ...host.style }}
      onScroll={event => {
        onScroll?.(event)
        if (virtual) setScrollTop(event.currentTarget.scrollTop)
      }}
      onFocus={event => {
        onFocus?.(event)
        if (event.target === event.currentTarget && event.currentTarget.matches(':focus-visible'))
          reveal(activeIndex)
      }}
      onBlur={event => {
        onBlur?.(event)
        search.current = { text: '', time: 0 }
      }}
      onKeyDown={event => composeAction(onKeyDown, navigate)(event)}
      onClick={composeAction(onClick, event => {
        const target = event.target as Element
        const row = target.closest('[data-slot="tree-row"]')
        const item = row?.closest<HTMLElement>('[data-slot~="tree-item"]')
        if (!item || item.closest('[role="tree"]') !== event.currentTarget) return
        const node = model.byValue.get(item.dataset.value ?? '')
        if (!node || node.disabled) return
        event.currentTarget.focus({ preventScroll: true })
        setFocused(node.value)
        if (target.closest('[data-slot~="tree-disclosure"]')) toggle(node)
        else activate(node)
      })}
    >
      {virtual ? (
        <div
          role="none"
          className="relative"
          style={{ height: rows.length * rowHeight }}
        >
          {windowed.map(renderRow)}
        </div>
      ) : (
        model.roots.map(renderRow)
      )}
    </div>
  )
}
