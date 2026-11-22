import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AudioPlayer } from '@cognitap/radiant'
test('AudioPlayer renders a named group with a toggle, scrubber and time on the server', () => {
  const html = renderToStaticMarkup(
    h(AudioPlayer, {
      'aria-label': 'Voice note',
      src: '/clip.wav',
      playLabel: 'Play',
      pauseLabel: 'Pause',
      seekLabel: 'Seek'
    })
  )
  assert.match(html, /^<div aria-label="Voice note" role="group" data-slot="audio-player"/)
  assert.match(html, /data-state="paused"/)
  assert.match(html, /<audio data-slot="audio-player-media" src="\/clip.wav" preload="metadata">/)
  assert.match(html, /<button[^>]*aria-label="Play"[^>]*data-slot="[^"]*audio-player-toggle/)
  assert.match(html, /<input[^>]*aria-label="Seek"[^>]*disabled=""/)
  assert.match(html, /<bdi>0:00<\/bdi> \/ <bdi>--:--<\/bdi>/)
  assert.throws(
    () =>
      renderToStaticMarkup(
        h(AudioPlayer, { compact: true, playLabel: 'Play', pauseLabel: 'Pause' } as never)
      ),
    TypeError
  )
})
