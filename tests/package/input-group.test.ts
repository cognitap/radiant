import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  Field,
  Kbd,
  KbdGroup,
  Button,
  ThemeScope,
  defineTheme
} from '@cognitap/radiant'
test('InputGroup preserves one real Input and every Field-owned native relationship', () => {
  const html = renderToStaticMarkup(
    h(
      Field,
      {
        label: 'Budget',
        controlId: 'budget',
        description: 'Approved amount',
        error: 'Review amount',
        required: true,
        disabled: true
      },
      h(
        InputGroup,
        {
          dir: 'rtl',
          controlSize: 'small',
          className: 'custom',
          style: { borderRadius: 0 },
          ref: () => {
            throw Error('SSR ref')
          }
        },
        h(InputGroupAddon, { 'aria-hidden': true }, '$'),
        h(InputGroupInput, {
          name: 'budget',
          defaultValue: '250',
          'aria-describedby': 'external',
          ref: () => {
            throw Error('SSR input ref')
          }
        }),
        h(InputGroupAddon, { 'aria-hidden': true }, 'USD')
      )
    )
  )
  assert.match(html, /data-slot="input-group"/)
  assert.match(html, /data-slot="input input-group-input"/)
  assert.equal((html.match(/<input/g) ?? []).length, 1)
  assert.match(html, /<label[^>]*for="budget"/)
  const input = html.match(/<input[^>]+>/)![0]
  for (const attr of [
    'id="budget"',
    'name="budget"',
    'value="250"',
    'required=""',
    'disabled=""',
    'aria-invalid="true"',
    'data-control-size="small"'
  ])
    assert.ok(input.includes(attr), attr)
  assert.match(input, /aria-describedby="[^"]+external"/)
  assert.match(html, /dir="rtl"/)
  assert.match(html, /border-radius:0/)
  assert.doesNotMatch(html, /role="group"|type="hidden"/)
})
test('Textarea and keyboard addons retain their native hosts, identities and caller styles', () => {
  const html = renderToStaticMarkup(
    h(
      InputGroup,
      {},
      h(InputGroupTextarea, {
        name: 'update',
        defaultValue: 'Reviewed',
        rows: 4,
        style: { color: 'red' },
        ref: () => {
          throw Error('SSR textarea ref')
        }
      }),
      h(
        InputGroupAddon,
        { 'data-slot': 'save-hint', style: { gap: '2px' } },
        h(KbdGroup, {
          children: [
            h(Kbd, { children: 'Control', key: 'control' }),
            '+',
            h(Kbd, { children: 'S', key: 's' })
          ]
        }),
        h(Button, { type: 'submit' }, 'Save')
      )
    )
  )
  assert.match(html, /<textarea[^>]*name="update"/)
  assert.match(html, /data-slot="textarea input-group-textarea"/)
  assert.match(html, /rows="4"/)
  assert.match(html, />Reviewed<\/textarea>/)
  assert.match(html, /color:red/)
  assert.match(html, /data-slot="input-group-addon save-hint"/)
  assert.match(html, /gap:2px/)
  assert.equal((html.match(/<kbd/g) ?? []).length, 3)
  assert.match(html, /<button[^>]*type="submit"/)
})
test('group boundary tokens are typed and misplaced parts or contradictory native owners fail', () => {
  const html = renderToStaticMarkup(
    h(
      ThemeScope,
      {
        theme: defineTheme({
          id: 'group',
          name: 'Group',
          components: {
            inputGroup: {
              background: 'white',
              color: 'black',
              borderColor: 'gray',
              borderWidth: '2px',
              radius: '3px',
              gap: '4px',
              paddingInline: '5px',
              focusColor: 'blue',
              focusWidth: '3px',
              focusOffset: '2px',
              invalidBorder: 'red'
            }
          }
        })
      },
      h(InputGroup, {}, h(InputGroupInput, { 'aria-label': 'Search', defaultValue: 'Reader' }))
    )
  )
  for (const name of [
    'background',
    'color',
    'border-color',
    'border-width',
    'radius',
    'gap',
    'padding-inline',
    'focus-color',
    'focus-width',
    'focus-offset',
    'invalid-border'
  ])
    assert.match(html, new RegExp(`--rad-input-group-${name}:`))
  for (const part of [h(InputGroupInput, {}), h(InputGroupTextarea, {}), h(InputGroupAddon, {})])
    assert.throws(() => renderToStaticMarkup(part), /require InputGroup/)
  for (const part of [
    h(InputGroupInput, JSON.parse('{"value":"a","defaultValue":"b"}')),
    h(InputGroupTextarea, JSON.parse('{"value":"a","defaultValue":"b"}'))
  ])
    assert.throws(() => renderToStaticMarkup(h(InputGroup, {}, part)), /controlled|both/)
})
