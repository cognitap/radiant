import type { ReactNode } from 'react'

export type TreeItem = {
  /** Unique across the tree, including children returned by loaders. */
  value: string
  label: string
  icon?: ReactNode
  disabled?: boolean
} & (
  | { children?: readonly TreeItem[]; loadChildren?: never }
  | { children?: never; loadChildren: (signal: AbortSignal) => Promise<readonly TreeItem[]> }
)

export type TreeLoad =
  | { status: 'loading' | 'error' }
  | { status: 'loaded'; children: readonly TreeItem[] }

export type TreeNode = {
  item: TreeItem
  value: string
  textValue: string
  disabled: boolean
  parent: TreeNode | null
  children: TreeNode[]
  branch: boolean
  load: TreeLoad | undefined
  level: number
  position: number
  size: number
}

export function buildTree(items: readonly TreeItem[], loads: ReadonlyMap<string, TreeLoad>) {
  const byValue = new Map<string, TreeNode>()
  function visit(siblings: readonly TreeItem[], parent: TreeNode | null): TreeNode[] {
    return siblings.map((item, index) => {
      if (typeof item.value !== 'string' || !item.value || byValue.has(item.value)) {
        throw new TypeError('Tree items must have unique, nonempty values.')
      }
      if (typeof item.label !== 'string' || !item.label.trim()) {
        throw new TypeError('Tree items must have a nonempty label.')
      }
      const load = item.loadChildren ? loads.get(item.value) : undefined
      const children = item.children ?? (load?.status === 'loaded' ? load.children : [])
      const node: TreeNode = {
        item,
        value: item.value,
        textValue: item.label,
        disabled: !!(item.disabled || parent?.disabled),
        parent,
        children: [],
        branch: children.length > 0 || (!!item.loadChildren && load?.status !== 'loaded'),
        load,
        level: (parent?.level ?? 0) + 1,
        position: index + 1,
        size: siblings.length
      }
      byValue.set(item.value, node)
      node.children = visit(children, node)
      return node
    })
  }
  return { roots: visit(items, null), byValue }
}

export function treePath(node: TreeNode | undefined): TreeNode[] {
  const path: TreeNode[] = []
  for (let current = node; current; current = current.parent ?? undefined) path.push(current)
  return path.reverse()
}

export function visibleTree(roots: TreeNode[], expanded: ReadonlySet<string>) {
  const rows: TreeNode[] = []
  function visit(nodes: TreeNode[]) {
    for (const node of nodes) {
      rows.push(node)
      if (expanded.has(node.value)) visit(node.children)
    }
  }
  visit(roots)
  return rows
}

/** Branches derive their state from the selectable leaves already loaded. */
export function branchChecks(roots: TreeNode[], selected: ReadonlySet<string>) {
  const checks = new Map<string, boolean | 'mixed'>()
  function visit(node: TreeNode): { total: number; checked: number } {
    if (node.disabled) return { total: 0, checked: 0 }
    let total = 0
    let checked = 0
    if (node.branch) {
      for (const child of node.children) {
        const counts = visit(child)
        total += counts.total
        checked += counts.checked
      }
    } else {
      total = 1
      checked = Number(selected.has(node.value))
    }
    if (total) checks.set(node.value, checked === total ? true : checked === 0 ? false : 'mixed')
    return { total, checked }
  }
  for (const root of roots) visit(root)
  return checks
}

export function selectableLeaves(node: TreeNode): string[] {
  if (node.disabled) return []
  return node.branch ? node.children.flatMap(selectableLeaves) : [node.value]
}
