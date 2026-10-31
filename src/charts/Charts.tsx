'use client'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode
} from 'react'
import { cn } from '../cn.js'
import { joinIds } from '../internal/ids.js'
import {
  chartGeometry,
  validateChart,
  type ChartDatum,
  type ChartSeries,
  type ChartKind
} from '../internal/charts.js'
import { ScrollArea } from '../ScrollArea.js'
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip.js'
import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  type TableProps
} from '../Table.js'
import type { PartStyle } from '../presentation.js'
import type { ThemeStyle } from '../themes/defineTheme.js'
export type { ChartDatum, ChartSeries } from '../internal/charts.js'
export type ChartProps = Omit<
  ComponentProps<'figure'>,
  'children' | 'style' | 'aria-labelledby' | 'aria-label' | 'role'
> & {
  label: ReactNode
  description?: ReactNode
  data: readonly ChartDatum[]
  series: readonly ChartSeries[]
  formatValue?: (value: number, series: ChartSeries) => string
  categoryLabel?: string
  plotLabel?: string
  legendLabel?: string
  tableLabel?: string
  emptyText?: string
  style?: ThemeStyle
  parts?: {
    caption?: PartStyle
    description?: PartStyle
    plot?: PartStyle
    legend?: PartStyle
    point?: PartStyle
    tooltip?: PartStyle
    table?: PartStyle
  }
  'data-slot'?: string
}
export type LineChartProps = ChartProps
export type BarChartProps = ChartProps
export type AreaChartProps = ChartProps
export type PieChartProps = Omit<ChartProps, 'series'> & { series: readonly [ChartSeries] }
const colors = [
  'var(--rad-chart-series1,color-mix(in oklab,var(--rad-color-accent) 55%,var(--rad-color-foreground)))',
  'var(--rad-chart-series2,color-mix(in oklab,var(--rad-color-focus) 65%,var(--rad-color-foreground)))',
  'var(--rad-chart-series3,color-mix(in oklab,var(--rad-color-warning) 45%,var(--rad-color-foreground)))',
  'var(--rad-chart-series4,color-mix(in oklab,var(--rad-color-danger) 65%,var(--rad-color-foreground)))',
  'var(--rad-chart-series5,var(--rad-color-foreground))',
  'var(--rad-chart-series6,var(--rad-color-muted-foreground))'
]
const color = (index: number) => colors[index % colors.length]!
const dashes = ['', '8 4', '2 4', '10 3 2 3', '4 3', '12 6']
const format = (value: number) => String(value)
const pointClass =
  'box-border inline-flex size-6 cursor-pointer select-none items-center justify-center rounded-full border-0 bg-transparent p-0 [color:inherit] hover:bg-[color-mix(in_oklch,currentColor_8%,transparent)] focus-visible:outline-solid focus-visible:[outline-color:var(--rad-color-focus,oklch(0.55_0.13_255))] focus-visible:[outline-width:var(--rad-focus-width,2px)] focus-visible:[outline-offset:var(--rad-focus-offset,2px)] focus-visible:[outline-style:var(--rad-focus-style,solid)] forced-colors:text-[CanvasText] forced-colors:focus-visible:outline-[Highlight]'
export type ChartDataTableProps = Omit<TableProps, 'children'> &
  Pick<ChartProps, 'data' | 'series' | 'formatValue' | 'categoryLabel'> & { label: string }
export function ChartDataTable({
  data,
  series,
  label,
  formatValue = format,
  categoryLabel = 'Category',
  ...props
}: ChartDataTableProps) {
  validateChart(data, series)
  return (
    <Table
      {...props}
      data-slot={joinIds('chart-data-table', props['data-slot'])}
    >
      <TableCaption>{label}</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeader scope="col">{categoryLabel}</TableHeader>
          {series.map(item => (
            <TableHeader
              key={item.key}
              scope="col"
            >
              {item.label}
            </TableHeader>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.key}>
            <TableHeader scope="row">{row.label}</TableHeader>
            {series.map(item => (
              <TableCell key={item.key}>
                {row.values[item.key] == null ? '—' : formatValue(row.values[item.key]!, item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
function Chart({
  kind,
  label,
  description,
  data,
  series,
  formatValue = format,
  categoryLabel = 'Category',
  plotLabel = 'Chart plot',
  legendLabel = 'Chart legend',
  tableLabel = 'View chart data',
  emptyText = 'No chart data to display.',
  parts,
  className,
  'aria-describedby': describedBy,
  ...props
}: ChartProps & { kind: ChartKind }) {
  if (label == null || label === false || label === '')
    throw new TypeError('Charts require a visible label.')
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const nativeProps = { ...props, role: undefined }
  const id = useId(),
    captionId = `${id}-caption`,
    descriptionId = description ? `${id}-description` : undefined,
    model = chartGeometry(kind, data, series, size),
    root = useRef<HTMLDivElement>(null),
    [focused, setFocused] = useState(0)
  const ordered = [...model.marks].sort((a, b) => a.row - b.row || a.series - b.series)
  const showPlot = ordered.length > 0
  useLayoutEffect(() => {
    const node = root.current
    if (!node || !showPlot) return
    const view = node.ownerDocument.defaultView!
    const measure = () => {
      const width = node.clientWidth,
        height = node.clientHeight
      setSize(previous =>
        previous?.width === width && previous.height === height ? previous : { width, height }
      )
    }
    measure()
    const observer = new view.ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [showPlot])
  return (
    <figure
      {...nativeProps}
      aria-labelledby={captionId}
      aria-describedby={joinIds(descriptionId, describedBy)}
      data-slot={joinIds('chart', `${kind}-chart`, props['data-slot'])}
      data-kind={kind}
      className={cn(
        'm-0 grid min-w-0 gap-[var(--rad-chart-gap,var(--rad-spacing-group-gap,1rem))] text-[var(--rad-color-foreground)] font-[family-name:var(--rad-typography-roles-ui-body-family,system-ui,sans-serif)] text-[length:var(--rad-typography-roles-ui-body-size,0.875rem)] leading-[var(--rad-typography-roles-ui-body-line-height,1.5)]',
        className
      )}
    >
      <figcaption
        id={captionId}
        className={cn(
          'font-[family-name:var(--rad-typography-roles-ui-title-family,system-ui,sans-serif)] font-[number:var(--rad-typography-roles-ui-title-weight,600)]',
          parts?.caption?.className
        )}
        style={parts?.caption?.style}
      >
        {label}
      </figcaption>
      {description && (
        <div
          id={descriptionId}
          className={parts?.description?.className}
          style={parts?.description?.style}
        >
          {description}
        </div>
      )}
      {ordered.length ? (
        <ScrollArea
          aria-label={plotLabel}
          orientation="horizontal"
        >
          <div
            ref={root}
            className={cn('relative h-[var(--rad-chart-height,20rem)]', parts?.plot?.className)}
            style={{ minWidth: Math.max(480, data.length * 72), ...parts?.plot?.style }}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${model.width} ${model.height}`}
              preserveAspectRatio="none"
              className="block size-full overflow-visible"
            >
              {model.ticks.map((tick, index) => (
                <g key={index}>
                  <line
                    x1={48}
                    x2={model.width - 24}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="var(--rad-chart-grid-color,var(--rad-color-border))"
                    className="forced-colors:stroke-[CanvasText]"
                  />
                  <text
                    x={40}
                    y={tick.y + 4}
                    textAnchor="end"
                    fill="var(--rad-color-muted-foreground)"
                    fontSize={12}
                  >
                    {formatValue(tick.value, series[0]!)}
                  </text>
                </g>
              ))}
              {model.labels.map((item, index) => (
                <text
                  key={index}
                  x={item.x}
                  y={model.height - 16}
                  textAnchor="middle"
                  fill="var(--rad-color-foreground)"
                  fontSize={12}
                >
                  {item.label}
                </text>
              ))}
              {model.paths.map((path, index) => (
                <g key={index}>
                  {kind === 'area' && (
                    <path
                      d={path.area}
                      fill={color(path.series)}
                      opacity={0.15}
                      className="forced-colors:fill-[Canvas]"
                    />
                  )}
                  {kind !== 'bar' && (
                    <path
                      d={path.line}
                      fill="none"
                      stroke={color(path.series)}
                      strokeWidth="var(--rad-chart-stroke-width,2)"
                      strokeDasharray={dashes[path.series]}
                      className="forced-colors:stroke-[CanvasText]"
                    />
                  )}
                </g>
              ))}
              {ordered.map(mark => {
                const index = kind === 'pie' ? mark.row : mark.series
                return kind === 'pie' ? (
                  <path
                    key={`${mark.row}-${mark.series}`}
                    d={mark.path}
                    fill={color(index)}
                    stroke="var(--rad-color-surface)"
                    strokeWidth={2}
                    className="forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
                  />
                ) : kind === 'bar' ? (
                  <rect
                    key={`${mark.row}-${mark.series}`}
                    x={mark.x - mark.width! / 2}
                    y={mark.top}
                    width={mark.width}
                    height={mark.height}
                    fill={color(index)}
                    stroke={color(index)}
                    className="forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
                  />
                ) : (
                  <circle
                    key={`${mark.row}-${mark.series}`}
                    cx={mark.x}
                    cy={mark.y}
                    r={3}
                    fill={color(index)}
                    className="forced-colors:fill-[CanvasText]"
                  />
                )
              })}
            </svg>
            {ordered.map((mark, index) => {
              const row = data[mark.row]!,
                item = series[mark.series]!,
                text = `${row.label}, ${item.label}: ${formatValue(mark.value, item)}`
              return (
                <div
                  key={`${row.key}-${item.key}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(mark.x / model.width) * 100}%`,
                    top: `${(mark.y / model.height) * 100}%`
                  }}
                >
                  <Tooltip openDelay={150}>
                    <TooltipTrigger
                      aria-label={text}
                      data-slot="chart-point"
                      tabIndex={Math.min(focused, ordered.length - 1) === index ? 0 : -1}
                      motion="off"
                      style={parts?.point?.style}
                      // A point is an inspection target, not an action, so none of Button's look applies.
                      render={native => (
                        <button
                          {...native}
                          className={cn(pointClass, parts?.point?.className)}
                        />
                      )}
                      onClick={event => event.preventDefault()}
                      onFocus={() => setFocused(index)}
                      onKeyDown={event => {
                        if (event.altKey || event.ctrlKey || event.metaKey) return
                        const rtl =
                          event.currentTarget.ownerDocument.defaultView!.getComputedStyle(
                            event.currentTarget
                          ).direction === 'rtl'
                        let next: number | undefined
                        if (event.key === 'Home') next = 0
                        else if (event.key === 'End') next = ordered.length - 1
                        else if (event.key === 'ArrowRight') next = index + (rtl ? -1 : 1)
                        else if (event.key === 'ArrowLeft') next = index + (rtl ? 1 : -1)
                        else if (event.key === 'ArrowDown') next = index + 1
                        else if (event.key === 'ArrowUp') next = index - 1
                        if (next !== undefined) {
                          event.preventDefault()
                          root.current
                            ?.querySelectorAll<HTMLButtonElement>('[data-slot~="chart-point"]')
                            [Math.max(0, Math.min(ordered.length - 1, next))]?.focus()
                        }
                      }}
                    >
                      <span aria-hidden="true">·</span>
                    </TooltipTrigger>
                    <TooltipContent
                      className={parts?.tooltip?.className}
                      style={parts?.tooltip?.style}
                    >
                      {text}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <p>{emptyText}</p>
      )}
      <ul
        className={cn('m-0 flex list-none flex-wrap gap-4 p-0', parts?.legend?.className)}
        style={parts?.legend?.style}
        aria-label={legendLabel}
      >
        {(kind === 'pie' ? data.map(row => ({ key: row.key, label: row.label })) : series).map(
          (item, index) => (
            <li
              key={item.key}
              className="flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                width={28}
                height={12}
              >
                <line
                  x1={0}
                  x2={28}
                  y1={6}
                  y2={6}
                  stroke={color(index)}
                  strokeWidth={3}
                  strokeDasharray={dashes[index % dashes.length]}
                  className="forced-colors:stroke-[CanvasText]"
                />
              </svg>
              {index + 1}. {item.label}
            </li>
          )
        )}
      </ul>
      <details>
        <summary className="cursor-pointer">{tableLabel}</summary>
        <ChartDataTable
          label={typeof label === 'string' ? `${label} data` : 'Chart data'}
          data={data}
          series={series}
          formatValue={formatValue}
          categoryLabel={categoryLabel}
          className={parts?.table?.className}
          style={parts?.table?.style}
        />
      </details>
    </figure>
  )
}
export function LineChart(props: ChartProps) {
  return (
    <Chart
      {...props}
      kind="line"
    />
  )
}
export function BarChart(props: ChartProps) {
  return (
    <Chart
      {...props}
      kind="bar"
    />
  )
}
export function AreaChart(props: ChartProps) {
  return (
    <Chart
      {...props}
      kind="area"
    />
  )
}
export function PieChart(props: PieChartProps) {
  return (
    <Chart
      {...props}
      kind="pie"
    />
  )
}
