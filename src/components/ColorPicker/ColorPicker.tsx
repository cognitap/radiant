'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from 'cn'
import {
  formatColor,
  parseColor,
  type ColorChannels,
  type ColorFormat
} from '../../color/colorValue.js'
import { joinIds } from '../../internal/ids.js'
import type { ControlSize, PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useControllableState } from '../../react/useControllableState.js'
import type { ValueOwner } from '../../react/useNativeOwner.js'
import type { ThemeStyle } from '../../themes/defineTheme.js'
import { Button } from '../Button/Button.js'
import { Field, type FieldProps } from '../Field/Field.js'
import { Slider } from '../Slider/Slider.js'
import { ColorArea } from './ColorArea.js'

export type ColorPickerSwatch = { color: string; label: string }
const defaultLabels = {
  area: 'Color area',
  lightness: 'Lightness',
  chroma: 'Chroma',
  hue: 'Hue',
  alpha: 'Opacity',
  swatches: 'Swatches',
  eyedropper: 'Sample a color',
  samplingError: 'Could not sample a color.'
}
export type ColorPickerProps = Omit<
  Extract<FieldProps, { layout: 'group' }>,
  'layout' | 'children' | 'parts' | 'name' | 'form' | 'required' | 'defaultValue'
> &
  ValueOwner<string> & {
    format?: ColorFormat
    onValueChange?: (color: string) => void
    swatches?: readonly ColorPickerSwatch[]
    eyedropper?: boolean
    controlSize?: ControlSize
    labels?: Partial<typeof defaultLabels>
    parts?: { area?: PartStyle; slider?: PartStyle; swatch?: PartStyle; output?: PartStyle }
  }

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open(options: { signal: AbortSignal }): Promise<{ sRGBHex: string }> }
}
const gradientClass =
  '[--_rad-picker-direction:to_right] rtl:[--_rad-picker-direction:to_left] [&::-webkit-slider-runnable-track]:[background:var(--_rad-picker-track)] [&::-moz-range-track]:[background:var(--_rad-picker-track)]'
const checker =
  'repeating-conic-gradient(var(--rad-color-neutral) 0% 25%,var(--rad-color-surface) 0% 50%) 0 0/8px 8px'

export function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  format = 'hex',
  swatches,
  eyedropper = false,
  controlSize = 'medium',
  labels,
  parts,
  ref,
  disabled,
  className,
  'data-slot': slot,
  ...props
}: ColorPickerProps) {
  const strings = { ...defaultLabels, ...labels }
  const state = useControllableState({
    name: 'ColorPicker value',
    value,
    defaultValue,
    initialValue: '#456BE4',
    onChange: onValueChange
  })
  const [working, setWorking] = useState<{ serialized: string; color: ColorChannels } | null>(null)
  const parsed = parseColor(state.value)
  if (!parsed) throw new TypeError('ColorPicker value must be a hex, RGB or OKLCH color.')
  const serialized = formatColor(parsed, format)
  const color = working?.serialized === serialized ? working.color : parsed
  const maxChroma = Math.max(0.4, color.C)

  function commit(next: ColorChannels) {
    const serialized = formatColor(next, format)
    setWorking({ serialized, color: next })
    state.request(serialized)
  }

  const [host, setHost] = useState<HTMLFieldSetElement | null>(null)
  const hostRef = useComposedRefs(ref, setHost)
  const eye = eyedropper
    ? (host?.ownerDocument.defaultView as EyeDropperWindow | null)?.EyeDropper
    : undefined
  const request = useRef<AbortController>(null)
  const latest = useRef(commit)
  const [sampling, setSampling] = useState(false)
  const [error, setError] = useState(false)
  useLayoutEffect(() => {
    latest.current = commit
  })
  useEffect(() => () => request.current?.abort(), [disabled, eyedropper])

  async function sample() {
    if (!eye || disabled || request.current || host?.matches(':disabled')) return
    const controller = new AbortController()
    request.current = controller
    setSampling(true)
    setError(false)
    try {
      const result = await new eye().open({ signal: controller.signal })
      const picked = parseColor(result.sRGBHex)
      if (!controller.signal.aborted && picked) latest.current(picked)
    } catch (error) {
      if (
        !controller.signal.aborted &&
        !(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
      )
        setError(true)
    } finally {
      request.current = null
      if (host?.isConnected) setSampling(false)
    }
  }

  const controls = [
    {
      key: 'lightness',
      channel: 'L',
      value: color.L,
      max: 1,
      step: 0.01,
      text: `${Math.round(color.L * 100)}%`
    },
    {
      key: 'chroma',
      channel: 'C',
      value: color.C,
      max: maxChroma,
      step: 0.001,
      text: color.C.toFixed(3)
    },
    {
      key: 'hue',
      channel: 'h',
      value: color.h,
      max: 360,
      step: 1,
      text: `${Math.round(color.h)}°`,
      track: 'linear-gradient(var(--_rad-picker-direction),red,#ff0,lime,cyan,blue,magenta,red)'
    },
    {
      key: 'alpha',
      channel: 'alpha',
      value: color.alpha,
      max: 1,
      step: 0.01,
      text: `${Math.round(color.alpha * 100)}%`,
      track: `linear-gradient(var(--_rad-picker-direction),transparent,${formatColor({ ...color, alpha: 1 }, 'oklch')}),${checker}`
    }
  ] as const

  function renderControl(control: (typeof controls)[number]) {
    return (
      <Field
        key={control.key}
        label={strings[control.key]}
        className="gap-y-0"
      >
        <Slider
          data-slot={`color-picker-${control.key}`}
          controlSize={controlSize}
          min={0}
          max={control.max}
          step={control.step}
          value={control.value}
          aria-valuetext={control.text}
          onValueChange={next => commit({ ...color, [control.channel]: next })}
          className={cn('min-w-0', 'track' in control && gradientClass, parts?.slider?.className)}
          style={
            {
              ...('track' in control ? { '--_rad-picker-track': control.track } : {}),
              ...parts?.slider?.style
            } as ThemeStyle
          }
        />
      </Field>
    )
  }

  return (
    <Field
      {...props}
      ref={hostRef}
      layout="group"
      disabled={disabled}
      data-slot={joinIds('color-picker', slot)}
      className={cn('w-full max-w-xs min-w-0 gap-y-3', className)}
    >
      <fieldset
        aria-label={strings.area}
        className="grid min-w-0 gap-2"
      >
        <ColorArea
          color={color}
          maxChroma={maxChroma}
          disabled={disabled}
          part={parts?.area}
          onChange={commit}
        />
        <div className="grid min-w-0 grid-cols-2 gap-x-3">
          {controls.slice(0, 2).map(renderControl)}
        </div>
      </fieldset>
      <div className="grid min-w-0 grid-cols-2 gap-x-3">{controls.slice(2).map(renderControl)}</div>
      {swatches?.length ? (
        <fieldset
          aria-label={strings.swatches}
          className="flex flex-wrap gap-1"
          data-slot="color-picker-swatches"
        >
          {swatches.map(({ color: sample, label }, index) => {
            const shade = parseColor(sample)
            const swatchValue = shade ? formatColor(shade, format) : null
            if (!shade) throw new TypeError('ColorPicker swatches must be valid colors.')
            return (
              <Button
                key={index}
                aria-label={label}
                aria-pressed={swatchValue === serialized}
                variant="outline"
                tone="neutral"
                controlSize="small"
                iconOnly
                data-slot="color-picker-swatch"
                className={cn('px-1', parts?.swatch?.className)}
                style={parts?.swatch?.style}
                onClick={() => commit(shade)}
              >
                <span
                  aria-hidden="true"
                  className="size-5 rounded-[var(--rad-control-radius,0.25rem)] forced-color-adjust-none"
                  style={{
                    background: `linear-gradient(${formatColor(shade, 'oklch')},${formatColor(shade, 'oklch')}),${checker}`
                  }}
                />
              </Button>
            )
          })}
        </fieldset>
      ) : null}
      <output
        data-slot="color-picker-value"
        className={cn(
          'text-xs tabular-nums [color:var(--rad-color-muted-foreground)] [overflow-wrap:anywhere]',
          parts?.output?.className
        )}
        style={parts?.output?.style}
        aria-live="off"
      >
        {serialized}
      </output>
      {eye && (
        <Button
          variant="outline"
          tone="neutral"
          controlSize="small"
          pending={sampling}
          onClick={sample}
        >
          {strings.eyedropper}
        </Button>
      )}
      {error && (
        <output className="text-sm [color:var(--rad-color-invalid)]">
          {strings.samplingError}
        </output>
      )}
    </Field>
  )
}
