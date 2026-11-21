import { existsSync, readdirSync, rmdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// `pnpm build` writes over dist/library in place so a running consumer never
// sees the folder disappear. Afterwards, remove what this build would not
// produce: output of deleted or renamed sources, then empty folders.
const root = fileURLToPath(new URL('../', import.meta.url))
const library = path.join(root, 'dist/library')
// Written by build:css and watch:styles, not by tsc.
const css = ['styles.css', 'reset.css']

export function expectedFiles(project = path.join(root, 'tsconfig.build.json')) {
  const config = ts.getParsedCommandLineOfConfigFile(project, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: diagnostic => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    }
  })
  if (!config) throw new Error(`Could not read ${project}`)
  const program = ts.createProgram({ rootNames: config.fileNames, options: config.options })
  const ignoreCase = !ts.sys.useCaseSensitiveFileNames
  const files = new Set<string>()
  for (const source of program.getSourceFiles()) {
    if (source.isDeclarationFile || program.isSourceFileFromExternalLibrary(source)) continue
    for (const output of ts.getOutputFileNames(config, source.fileName, ignoreCase)) {
      files.add(path.resolve(output))
    }
  }
  return files
}

export function prune(directory: string, keep: Set<string>) {
  // A file the build should have written but did not means the expected set is
  // wrong, so delete nothing rather than guess.
  const missing = [...keep].filter(file => !existsSync(file))
  if (missing.length > 0) throw new Error(`Build output is missing ${missing.join(', ')}`)
  const removed: string[] = []
  const visit = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name)
      if (entry.isDirectory()) {
        visit(file)
        if (readdirSync(file).length === 0) rmdirSync(file)
      } else if (!keep.has(file)) {
        rmSync(file, { force: true })
        removed.push(file)
      }
    }
  }
  visit(directory)
  return removed
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const keep = expectedFiles()
  for (const name of css) keep.add(path.join(library, name))
  for (const file of prune(library, keep)) console.log(`Removed stale ${path.relative(root, file)}`)
}
