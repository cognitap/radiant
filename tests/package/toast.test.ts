import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastClose } from '@cognitap/radiant'
test('Toast server markup has empty persistent announcers and hidden queue candidates', () => {
  const html = renderToStaticMarkup(
    h(
      ToastProvider,
      null,
      h(
        ToastViewport,
        JSON.parse('{"role":"dialog"}'),
        h(
          Toast,
          { defaultOpen: true },
          h(ToastTitle, null, 'Saved'),
          h(ToastClose, null, 'Dismiss')
        )
      )
    )
  )
  assert.match(html, /<output[^>]*data-slot="toast-announcer"><\/output>/)
  assert.match(html, /role="alert"><\/div>/)
  assert.match(html, /hidden=""/)
  assert.doesNotMatch(html, /role="dialog"/)
  assert.match(html, /aria-keyshortcuts="F8"/)
  assert.match(html, /data-slot="alert toast"/)
  assert.throws(() => renderToStaticMarkup(h(Toast)), /inside ToastProvider/)
  assert.throws(() => renderToStaticMarkup(h(ToastClose)), /inside Toast/)
  assert.throws(() => renderToStaticMarkup(h(ToastProvider, { duration: -1 })), /Toast duration/)
})
