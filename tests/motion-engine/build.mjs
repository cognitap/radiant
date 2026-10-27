import { build } from 'esbuild'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
await build({
  entryPoints: ['App.jsx'],
  outfile: 'app.js',
  bundle: true,
  format: 'esm',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic'
})
await copyFile('node_modules/@cognitap/radiant/dist/library/styles.css', 'radiant.css')
await build({
  entryPoints: ['App.jsx'],
  outfile: 'ssr.mjs',
  bundle: true,
  platform: 'node',
  packages: 'external',
  format: 'esm',
  jsx: 'automatic'
})
await mkdir('measure', { recursive: true })
const base =
  "import {Button} from '@cognitap/radiant'; import {createRoot} from 'react-dom/client'; globalThis.host={Button,createRoot};\n"
const entries = {
  baseline: base,
  'basic-motion': base + "import {springValue} from 'motion'; globalThis.engine={springValue};",
  'generic-motion':
    base + "import {animate,motionValue} from 'motion'; globalThis.engine={animate,motionValue};",
  'spring-value':
    base + "import {SpringValue} from '@react-spring/web';globalThis.engine={SpringValue};",
  'drag-layout':
    base +
    "import {motion,Reorder,MotionConfig} from 'motion/react';globalThis.engine={motion,Reorder,MotionConfig};"
}
const bundles = {}
for (const [name, contents] of Object.entries(entries)) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd() },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    metafile: true,
    define: { 'process.env.NODE_ENV': '"production"' }
  })
  const bytes = result.outputFiles[0].contents
  bundles[name] = {
    bytes: bytes.length,
    gzip: gzipSync(bytes).length,
    analyzedModules: Object.keys(result.metafile.inputs).length
  }
}
for (const value of Object.values(bundles)) {
  value.incrementalBytes = value.bytes - bundles.baseline.bytes
  value.incrementalGzip = value.gzip - bundles.baseline.gzip
}
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
await writeFile(
  'bundle-results.json',
  JSON.stringify(
    {
      bundler: lock.packages['node_modules/esbuild'].version,
      definition:
        'Production browser ESM, minified, includes React DOM and one installed Radiant Button. Incremental gzip is whole-bundle difference from the same baseline; not a separate CDN package size.',
      bundles
    },
    null,
    2
  )
)
console.log(JSON.stringify(bundles))
