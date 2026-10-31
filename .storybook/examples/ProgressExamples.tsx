import { useId, useState } from 'react'
import { Button, Progress, type ProgressProps } from '../../src/index.js'
export type ProgressTaskOptions = Pick<ProgressProps, 'className' | 'style'>
const files = ['interview-01.wav', 'interview-02.wav', 'notes.md', 'consent.pdf', 'clips.zip']
export function UploadFiles(props: ProgressTaskOptions) {
  const id = useId(),
    [phase, setPhase] = useState<'idle' | 'preparing' | 'uploading'>('idle'),
    [uploaded, setUploaded] = useState(0)
  const done = uploaded === files.length,
    text =
      phase === 'preparing' ? 'Preparing upload' : `${uploaded} of ${files.length} files uploaded`
  return (
    <section
      aria-label="Study files"
      style={{
        display: 'grid',
        gap: '1rem',
        width: 'min(24rem, calc(100vw - 2rem))',
        maxWidth: '100%'
      }}
    >
      <label htmlFor={id}>Upload progress</label>
      <Progress
        {...props}
        id={id}
        value={phase === 'preparing' ? null : uploaded}
        max={files.length}
        aria-valuetext={text}
      />
      <p>
        {phase === 'uploading' && !done ? `Uploading ${files[uploaded]}. ` : ''}
        {text}.
      </p>
      <output>{done ? 'All study files uploaded.' : ''}</output>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
        {phase === 'idle' ? (
          <Button onClick={() => setPhase('preparing')}>Upload files</Button>
        ) : phase === 'preparing' ? (
          <Button onClick={() => setPhase('uploading')}>Finish preparing</Button>
        ) : (
          <Button
            disabled={done}
            onClick={() => setUploaded(count => count + 1)}
          >
            Upload next file
          </Button>
        )}
        <Button
          variant="outline"
          disabled={phase === 'idle'}
          onClick={() => {
            setPhase('idle')
            setUploaded(0)
          }}
        >
          Reset
        </Button>
      </div>
    </section>
  )
}
