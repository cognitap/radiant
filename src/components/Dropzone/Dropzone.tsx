'use client'

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Native form reset must leave the React-managed status children in place. */
import { useId, useRef, useState, type DragEvent } from 'react'
import { cn } from 'cn'
import { joinIds } from '../../internal/ids.js'
import type { PartStyle } from '../../presentation.js'
import { useComposedRefs } from '../../react/useComposedRefs.js'
import { useFormReset } from '../../react/useFormReset.js'
import { useField } from '../Field/Field.js'
import { FileInput, type FileInputProps } from '../FileInput/FileInput.js'
import { focusWithinRingClass } from '../shared/focusStyles.js'

export type DropzoneRejection = {
  file: File
  reason: 'type' | 'size' | 'count'
}

export type DropzoneSelection = {
  accepted: readonly File[]
  rejected: readonly DropzoneRejection[]
}

export type DropzoneProps = Omit<
  FileInputProps,
  'parts' | 'onChange' | 'onDrop' | 'onDragEnter' | 'onDragOver' | 'onDragLeave'
> & {
  /** Per-file limit, in bytes. */
  maxSize?: number
  maxFiles?: number
  description?: string
  rejectionText?: (rejection: DropzoneRejection) => string
  onFilesChange?: (selection: DropzoneSelection) => void
  parts?: { label?: PartStyle; description?: PartStyle; status?: PartStyle }
}

const reasons = {
  type: 'Unsupported file type',
  size: 'File is too large',
  count: 'Too many files'
}

function matchesAccept(file: File, tokens: string[]) {
  if (!tokens.length) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return tokens.some(token =>
    token.startsWith('.')
      ? name.endsWith(token)
      : token.endsWith('/*')
        ? type.startsWith(token.slice(0, -1))
        : type === token
  )
}

/** A file input that accepts both file-picker and drop selections. */
export function Dropzone({
  accept,
  multiple,
  maxSize,
  maxFiles,
  chooseLabel = multiple ? 'Choose files or drop them here' : 'Choose a file or drop it here',
  description,
  emptyText,
  rejectionText = rejection => rejection.file.name + ' — ' + reasons[rejection.reason],
  onFilesChange,
  className,
  style,
  parts,
  ref,
  'data-slot': slot,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...props
}: DropzoneProps) {
  if (maxSize !== undefined && (!Number.isFinite(maxSize) || maxSize < 0)) {
    throw new RangeError('Dropzone maxSize must be a nonnegative number of bytes.')
  }
  if (maxFiles !== undefined && (!Number.isSafeInteger(maxFiles) || maxFiles < 1)) {
    throw new RangeError('Dropzone maxFiles must be a positive integer.')
  }
  const field = useField()
  const input = useRef<HTMLInputElement>(null)
  const inputRef = useComposedRefs(input, ref)
  const labelId = useId()
  const descriptionId = useId()
  const depth = useRef(0)
  const [dragOver, setDragOver] = useState(false)
  const [selection, setSelection] = useState<DropzoneSelection | null>(null)
  useFormReset(input, () => setSelection(null))
  const disabled = props.disabled || field?.disabled
  const tokens = (accept ?? '')
    .toLowerCase()
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)

  function select(node: HTMLInputElement, files: readonly File[], dropped = false) {
    const accepted: File[] = []
    const rejected: DropzoneRejection[] = []
    for (const file of files) {
      if (!matchesAccept(file, tokens)) rejected.push({ file, reason: 'type' })
      else if (maxSize !== undefined && file.size > maxSize) rejected.push({ file, reason: 'size' })
      else if (accepted.length >= (multiple ? (maxFiles ?? Infinity) : 1))
        rejected.push({ file, reason: 'count' })
      else accepted.push(file)
    }
    if (dropped || rejected.length) {
      const view = node.ownerDocument.defaultView!
      const transfer = new view.DataTransfer()
      for (const file of accepted) transfer.items.add(file)
      node.files = transfer.files
    }
    const result = { accepted, rejected }
    setSelection(result)
    onFilesChange?.(result)
  }

  function filesIn(event: DragEvent<HTMLDivElement>) {
    return event.dataTransfer.types.includes('Files') || event.dataTransfer.files.length > 0
  }
  const active = !disabled && dragOver
  const state = active
    ? 'drag-over'
    : selection?.rejected.length
      ? 'rejected'
      : selection?.accepted.length
        ? 'accepted'
        : 'idle'

  return (
    <div
      data-slot={joinIds('dropzone', slot)}
      data-state={state}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'relative grid min-w-0 w-full gap-1 rounded-[var(--rad-control-radius,0.5rem)] [corner-shape:var(--rad-control-corner-shape,round)] border-2 border-dashed border-[var(--rad-color-border)] bg-[var(--rad-color-surface)] px-4 py-5 text-center [color:var(--rad-color-foreground)]',
        'has-[input:enabled]:hover:bg-[var(--rad-color-neutral)] data-[state=drag-over]:border-[var(--rad-color-accent)] data-[state=drag-over]:bg-[var(--rad-color-neutral)] data-[state=rejected]:border-[var(--rad-color-invalid)] data-disabled:opacity-60 forced-colors:border-[CanvasText] forced-colors:data-[state=drag-over]:border-[Highlight]',
        focusWithinRingClass,
        className
      )}
      style={style}
      onDragEnter={event => {
        if (!filesIn(event)) return
        event.preventDefault()
        if (input.current?.matches(':enabled')) {
          depth.current++
          setDragOver(true)
        }
      }}
      onDragOver={event => {
        if (!filesIn(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = input.current?.matches(':enabled') ? 'copy' : 'none'
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (!depth.current) setDragOver(false)
      }}
      onDrop={event => {
        depth.current = 0
        setDragOver(false)
        if (!filesIn(event)) return
        event.preventDefault()
        const node = input.current
        if (node?.matches(':enabled')) select(node, Array.from(event.dataTransfer.files), true)
      }}
    >
      <FileInput
        {...props}
        ref={inputRef}
        multiple={multiple}
        accept={accept}
        aria-label={ariaLabel}
        aria-labelledby={
          labelledBy ??
          (ariaLabel ? undefined : field?.layout === 'control' ? field.labelId : labelId)
        }
        aria-describedby={joinIds(describedBy, description ? descriptionId : undefined)}
        onChange={event => select(event.currentTarget, Array.from(event.currentTarget.files ?? []))}
        data-slot="dropzone-input"
        className="disabled:cursor-not-allowed"
        parts={{
          wrapper: { className: 'absolute inset-0 z-10' },
          trigger: { className: '[&[aria-hidden]]:hidden' },
          files: { className: '[&[aria-hidden]]:hidden' }
        }}
      />
      <span
        id={labelId}
        data-slot="dropzone-label"
        className={cn('text-sm font-semibold', parts?.label?.className)}
        style={parts?.label?.style}
      >
        {chooseLabel}
      </span>
      {description && (
        <span
          id={descriptionId}
          data-slot="dropzone-description"
          className={cn(
            'text-xs [color:var(--rad-color-muted-foreground)]',
            parts?.description?.className
          )}
          style={parts?.description?.style}
        >
          {description}
        </span>
      )}
      <div
        role="status"
        data-slot="dropzone-status"
        className={cn('grid gap-1 text-xs [overflow-wrap:anywhere]', parts?.status?.className)}
        style={parts?.status?.style}
      >
        {selection?.accepted.map((file, index) => (
          <span key={index}>{file.name}</span>
        ))}
        {selection?.rejected.map((rejection, index) => (
          <span
            key={index}
            className="[color:var(--rad-color-invalid)]"
          >
            {rejectionText(rejection)}
          </span>
        ))}
        {!selection && emptyText}
      </div>
    </div>
  )
}
