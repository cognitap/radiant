'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { cn } from './cn.js'
import { joinIds } from './internal/ids.js'
import type { ControlSize, PartStyle } from './presentation.js'
import type { ThemeStyle } from './themes/defineTheme.js'

type ImagePolicy = Pick<
  ComponentProps<'img'>,
  'srcSet' | 'sizes' | 'loading' | 'decoding' | 'crossOrigin' | 'referrerPolicy'
> & { src?: string }
export type AvatarProps = Omit<
  ComponentProps<'span'>,
  | 'style'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'role'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-hidden'
  | 'aria-live'
  | 'tabIndex'
  | 'contentEditable'
> &
  ImagePolicy & {
    /** Full image alternative; empty when decorative or named by adjacent text. */
    alt: string
    /** Short visual text, such as initials. Never supplies a second accessible name. */
    fallback?: string
    controlSize?: ControlSize
    style?: ThemeStyle
    'data-slot'?: string
    parts?: { image?: PartStyle; fallback?: PartStyle }
  }

export function Avatar({
  alt,
  fallback = '?',
  controlSize = 'medium',
  src,
  srcSet,
  sizes,
  loading,
  decoding,
  crossOrigin,
  referrerPolicy,
  parts,
  className,
  ...props
}: AvatarProps) {
  if (typeof alt !== 'string' || (alt.length > 0 && !alt.trim()))
    throw new TypeError('Avatar alt must be meaningful text or an empty string for decoration.')
  if (typeof fallback !== 'string') throw new TypeError('Avatar fallback must be plain text.')
  const {
    children: _children,
    dangerouslySetInnerHTML: _html,
    ...attributes
  }: ComponentProps<'span'> = props
  const nativeProps = {
    ...attributes,
    tabIndex: undefined,
    contentEditable: undefined,
    'aria-labelledby': undefined,
    'aria-live': undefined
  }
  const policy = { src, srcSet, sizes, loading, decoding, crossOrigin, referrerPolicy }
  const key = JSON.stringify([src, srcSet, sizes, crossOrigin, referrerPolicy])
  return (
    <span
      {...nativeProps}
      role={alt === '' ? undefined : 'img'}
      aria-label={alt || undefined}
      aria-hidden={alt === '' ? true : undefined}
      data-slot={joinIds('avatar', props['data-slot'])}
      data-control-size={controlSize}
      className={cn(
        'relative box-border inline-grid shrink-0 overflow-hidden align-middle rounded-[var(--rad-avatar-radius,9999px)] border-solid border-[length:var(--rad-avatar-border-width,var(--rad-surface-border-width,1px))] [border-color:var(--rad-avatar-border-color,var(--rad-color-border))]',
        'bg-[var(--rad-avatar-background,var(--rad-color-neutral))] [color:var(--rad-avatar-color,var(--rad-color-neutral-foreground))] font-[family-name:var(--rad-typography-roles-ui-label-family,system-ui,sans-serif)] text-[length:var(--rad-avatar-font-size,var(--rad-typography-roles-ui-label-size,0.875rem))] font-[number:var(--rad-typography-roles-ui-label-weight,600)] leading-none',
        controlSize === 'small'
          ? 'size-[var(--rad-avatar-size-small,2rem)]'
          : controlSize === 'large'
            ? 'size-[var(--rad-avatar-size-large,3rem)]'
            : 'size-[var(--rad-avatar-size,2.5rem)]',
        'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]',
        className
      )}
    >
      {src || srcSet ? (
        <ImageContent
          key={key}
          policy={policy}
          fallback={fallback}
          parts={parts}
        />
      ) : (
        <Fallback
          text={fallback}
          state="fallback"
          part={parts?.fallback}
        />
      )}
    </span>
  )
}
function Fallback({ text, state, part }: { text: string; state: string; part?: PartStyle }) {
  return (
    <span
      aria-hidden="true"
      data-slot="avatar-fallback"
      data-state={state}
      className={cn(
        'flex size-full min-w-0 items-center justify-center overflow-hidden whitespace-nowrap',
        part?.className
      )}
      style={part?.style}
    >
      {text}
    </span>
  )
}
function ImageContent({
  policy,
  fallback,
  parts
}: {
  policy: ImagePolicy
  fallback: string
  parts?: AvatarProps['parts']
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  useEffect(() => {
    const image = ref.current
    // Read native requests that may have completed before hydration attached handlers.
    if (image?.complete) setState(image.naturalWidth > 0 ? 'loaded' : 'error')
  }, [])
  return (
    <>
      <img
        {...policy}
        ref={ref}
        alt=""
        aria-hidden="true"
        draggable="false"
        data-slot="avatar-image"
        data-state={state}
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
        className={cn(
          'absolute inset-0 size-full object-cover',
          state === 'loaded' ? 'opacity-100' : 'opacity-0',
          parts?.image?.className
        )}
        style={parts?.image?.style}
      />
      {state !== 'loaded' && (
        <Fallback
          text={fallback}
          state={state}
          part={parts?.fallback}
        />
      )}
    </>
  )
}
