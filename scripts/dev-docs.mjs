import { spawn } from 'node:child_process'

const commands = [
  ['run', 'watch:js'],
  ['run', 'watch:styles'],
  ['run', 'watch:theme'],
  ['--filter', '@cognitap/radiant-docs', 'dev']
]
const grouped = process.platform !== 'win32'
const children = []
let stopping = false

function stop(code) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) {
    if (!child.pid) continue
    try {
      if (grouped) process.kill(-child.pid, 'SIGTERM')
      else child.kill('SIGTERM')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

for (const args of commands) {
  const child = spawn('pnpm', args, { stdio: 'inherit', detached: grouped })
  children.push(child)
  child.on('error', error => {
    console.error(error)
    stop(1)
  })
  child.on('exit', code => stop(code ?? 1))
}
