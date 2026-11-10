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
    const { Dialog, DialogContent, DialogTitle, DialogDescription, AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, Checkbox, Radio } = await import('./dist/library/index.js');
    const ref = () => { throw new Error('A server render attached a DOM ref'); };
    const html = renderToString(h(Dialog, { defaultOpen: true },
      h(DialogContent, { ref }, h(DialogTitle, null, 'Panel'), h(DialogDescription, null, 'Details'),
        h(Checkbox, { ref, label: 'Mixed', indeterminate: true }), h(Radio, { ref, label: 'Choice', value: 'yes' }))));
    assert.doesNotMatch(html.match(/<dialog\\b[^>]*>/)?.[0] ?? '', /\\sopen(?:=|\\s|>)/);
    const alert = renderToString(h(AlertDialog, { defaultOpen: true }, h(AlertDialogContent, { ref }, h(AlertDialogTitle, null, 'Confirm'), h(AlertDialogDescription, null, 'Message'), h(AlertDialogCancel, { ref }, 'Cancel'))));
    assert.match(alert, /role="alertdialog"/);
    const { Popover, PopoverTrigger, PopoverContent } = await import('./dist/library/index.js');
    assert.match(renderToString(h(Popover, { defaultOpen: true }, h(PopoverTrigger, { ref }, 'Details'), h(PopoverContent, { ref }, 'Content'))), /popover="manual"/);
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
  for (const entry of [
    'index.js',
    'components/Card/Card.js',
    'components/Link/Link.js',
    'themes/index.js',
    'examples/index.js'
  ]) {
    const filename = fileURLToPath(new URL(`../dist/library/${entry}`, import.meta.url))
    if (entry === 'index.js') {
      assert.doesNotMatch(readFileSync(filename, 'utf8'), /^['"]use client['"]/)
    } else visit(filename)
  }
})

function sourceModules() {
  const modules = new Map()
  for (const file of readdirSync(source, { recursive: true })) {
    if (!/\.tsx?$/.test(file) || /\.(stories|test)\.tsx?$|\.d\.ts$/.test(file)) continue
    const filename = resolve(source, file)
    modules.set(
      filename,
      ts.createSourceFile(filename, readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true)
    )
  }
  return modules
}

test('modules that use state, context, refs or effects are marked "use client"', () => {
  for (const [filename, module] of sourceModules()) {
    const stateful = module.statements.some(statement => {
      if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== 'react')
        return false
      const names = statement.importClause?.namedBindings
      return (
        !statement.importClause?.isTypeOnly &&
        names !== undefined &&
        ts.isNamedImports(names) &&
        names.elements.some(
          name =>
            !name.isTypeOnly &&
            /^(?:use(?!Id$)[A-Z]|createContext$)/.test((name.propertyName ?? name.name).text)
        )
      )
    })
    if (!stateful) continue
    const first = module.statements[0]
    assert.ok(
      ts.isExpressionStatement(first) &&
        ts.isStringLiteral(first.expression) &&
        first.expression.text === 'use client',
      `${filename} uses client-only React APIs without "use client"`
    )
  }
})

test('source modules import each other without cycles', () => {
  const modules = sourceModules()
  const imports = new Map()
  for (const [filename, module] of modules) {
    const targets = []
    for (const statement of module.statements) {
      if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue
      const specifier = statement.moduleSpecifier
      if (!specifier || !ts.isStringLiteral(specifier) || !specifier.text.startsWith('.')) continue
      const base = resolve(dirname(filename), specifier.text).replace(/\.js$/, '')
      const target = [`${base}.ts`, `${base}.tsx`].find(candidate => modules.has(candidate))
      if (target) targets.push(target)
    }
    imports.set(filename, targets)
  }
  const done = new Set()
  const path = []
  function visit(filename) {
    if (done.has(filename)) return
    const start = path.indexOf(filename)
    assert.equal(
      start,
      -1,
      `Import cycle: ${[...path.slice(start), filename].map(file => file.slice(source.length)).join(' -> ')}`
    )
    path.push(filename)
    for (const target of imports.get(filename)) visit(target)
    path.pop()
    done.add(filename)
  }
  for (const filename of modules.keys()) visit(filename)
})

test('one-sided borders zero the other sides without the opt-in reset', () => {
  const oneSide = /(?:^|\s)border-[trblsexy]-(?:\d|\[length:)/
  const allSides =
    /(?:^|\s)(?:border|border-\d|border-\[length:[^\s]*\]|\[border-width:[^\s]*\])(?=\s|$)/
  for (const file of readdirSync(source, { recursive: true })) {
    if (!/\.tsx?$/.test(file) || /\.(stories|test)\.tsx?$/.test(file)) continue
    const filename = resolve(source, file)
    const module = ts.createSourceFile(
      filename,
      readFileSync(filename, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    )
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText() === 'cn') {
        const classes = []
        node.arguments.forEach(function collect(arg) {
          if (ts.isStringLiteralLike(arg)) classes.push(arg.text)
          ts.forEachChild(arg, collect)
        })
        const text = classes.join(' ')
        if (oneSide.test(text)) {
          assert.match(
            text,
            allSides,
            `${file}:${module.getLineAndCharacterOfPosition(node.pos).line + 1} sets one border side without zeroing the rest`
          )
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(module)
  }
})

test('native scroll boxes draw the themed scrollbar unless they hide it', () => {
  const scrolls = /(?:^|\s|:)overflow-(?:[xy]-)?(?:auto|scroll)(?=\s|$)/
  for (const file of readdirSync(resolve(source, 'components'), { recursive: true })) {
    if (!file.endsWith('.tsx') || /\.(stories|test)\.tsx$/.test(file)) continue
    const text = readFileSync(resolve(source, 'components', file), 'utf8')
    if (!scrolls.test(text) || text.includes('[scrollbar-width:none]')) continue
    assert.match(text, /\bscrollbarClass\b/, `${file} scrolls natively without scrollbarClass`)
  }
})
