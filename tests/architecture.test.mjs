import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

const source = fileURLToPath(new URL('../src/', import.meta.url))

test('private policy and React bindings respect the documented import seams', () => {
  for (const area of ['internal', 'react']) {
    const folder = resolve(source, area)
    for (const relative of readdirSync(folder, { recursive: true }).filter(file =>
      file.endsWith('.ts')
    )) {
      const filename = resolve(folder, relative)
      const module = ts.createSourceFile(
        filename,
        readFileSync(filename, 'utf8'),
        ts.ScriptTarget.Latest,
        true
      )
      for (const statement of module.statements) {
        if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
        const specifier = statement.moduleSpecifier
        if (!specifier || !ts.isStringLiteral(specifier)) continue
        if (area === 'react' && specifier.text === 'react') continue
        assert.ok(
          specifier.text.startsWith('.'),
          `${filename} imports unsupported dependency ${specifier.text}`
        )
        const target = resolve(dirname(filename), specifier.text)
        assert.ok(
          target.startsWith(resolve(source, 'internal') + '/') ||
            (area === 'react' && target.startsWith(folder + '/')),
          `${filename} crosses its private seam: ${specifier.text}`
        )
      }
    }
  }
})

test('package import and server rendering do not read browser globals or attach refs', () => {
  const script = `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToString } from 'react-dom/server';
    for (const name of ['window', 'document', 'localStorage']) {
      Object.defineProperty(globalThis, name, { get() { throw new Error('Unexpected browser read: ' + name); } });
    }
    const { Dialog, DialogContent, DialogTitle, DialogDescription, Checkbox, Radio } = await import('./dist/library/index.js');
    const ref = () => { throw new Error('A server render attached a DOM ref'); };
    const html = renderToString(h(Dialog, { defaultOpen: true },
      h(DialogContent, { ref }, h(DialogTitle, null, 'Panel'), h(DialogDescription, null, 'Details'),
        h(Checkbox, { ref, label: 'Mixed', indeterminate: true }), h(Radio, { ref, label: 'Choice', value: 'yes' }))));
    assert.doesNotMatch(html.match(/<dialog\\b[^>]*>/)?.[0] ?? '', /\\sopen(?:=|\\s|>)/);
    for (const name of ['joinIds', 'composeAction', 'useComposedRefs', 'useControllableState', 'useNativeOwner', 'useFieldControl']) {
      assert.equal(name in await import('./dist/library/index.js'), false);
    }
  `
  execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'pipe'
  })
})

test('static rendering entries do not depend on client bindings', () => {
  const visited = new Set()
  function visit(filename) {
    if (visited.has(filename)) return
    visited.add(filename)
    const module = ts.createSourceFile(
      filename,
      readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    for (const statement of module.statements) {
      assert.ok(
        !(
          ts.isExpressionStatement(statement) &&
          ts.isStringLiteral(statement.expression) &&
          statement.expression.text === 'use client'
        ),
        `${filename} crosses a client boundary from a static entry`
      )
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
      const specifier = statement.moduleSpecifier
      if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
        visit(resolve(dirname(filename), specifier.text))
      }
    }
  }
  for (const entry of ['index.js', 'Card.js', 'Link.js', 'themes/index.js']) {
    const filename = fileURLToPath(new URL(`../dist/library/${entry}`, import.meta.url))
    if (entry === 'index.js') {
      assert.doesNotMatch(readFileSync(filename, 'utf8'), /^['"]use client['"]/)
    } else visit(filename)
  }
})
