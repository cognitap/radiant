import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from '@cognitap/radiant'

test('installed AlertDialog renders protected alert semantics, composed identities and closed server markup', () => {
  const html = renderToStaticMarkup(
    h(
      AlertDialog,
      { defaultOpen: true },
      h(AlertDialogTrigger, null, 'Review'),
      h(
        AlertDialogContent,
        { style: { '--rad-dialog-width': '24rem' } },
        h(AlertDialogTitle, null, 'Delete?'),
        h(AlertDialogDescription, null, 'Cannot be undone.'),
        h(AlertDialogAction, { tone: 'danger' }, 'Delete'),
        h(AlertDialogCancel, null, 'Keep')
      )
    )
  )
  const tag = html.match(/<dialog\b[^>]*>/)?.[0] ?? ''
  assert.match(tag, /role="alertdialog"/)
  assert.match(tag, /aria-modal="true"/)
  assert.doesNotMatch(tag, /\sopen(?:=|\s|>)/)
  assert.match(tag, /data-slot="dialog alert-dialog"/)
  assert.match(tag, /--rad-dialog-width:24rem/)
  const titleId = tag.match(/aria-labelledby="([^"]+)"/)?.[1]
  const descriptionId = tag.match(/aria-describedby="([^"]+)"/)?.[1]
  assert.ok(titleId && html.includes(`id="${titleId}"`))
  assert.ok(descriptionId && html.includes(`id="${descriptionId}"`))
  assert.match(
    html,
    /data-slot="button dialog-close alert-dialog-close alert-dialog-cancel"[^>]*autofocus=""|autofocus=""[^>]*data-slot="button dialog-close alert-dialog-close alert-dialog-cancel"/
  )
  assert.match(html, /data-slot="button dialog-close alert-dialog-close alert-dialog-action"/)
})

test('installed AlertDialog parts reject ordinary or missing owners', () => {
  assert.throws(() => renderToStaticMarkup(h(AlertDialogCancel)), /inside AlertDialog/)
})
