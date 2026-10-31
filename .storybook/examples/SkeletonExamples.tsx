import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, Skeleton } from '../../src/index.js'

export function TextBlockExample() {
  return (
    <div style={{ display: 'grid', gap: '.75rem', width: '20rem', maxWidth: '100%' }}>
      <Skeleton style={{ width: '40%', height: '1.5rem' }} />
      <Skeleton />
      <Skeleton />
      <Skeleton style={{ width: '65%' }} />
    </div>
  )
}

export function CardPlaceholderExample() {
  return (
    <Card style={{ width: '20rem', maxWidth: '100%' }}>
      <CardHeader style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <Skeleton
          style={{
            '--rad-skeleton-width': '2.5rem',
            '--rad-skeleton-height': '2.5rem',
            '--rad-skeleton-radius': '50%',
            flexShrink: 0
          }}
        />
        <div style={{ display: 'grid', gap: '.5rem', flex: 1 }}>
          <Skeleton style={{ width: '60%' }} />
          <Skeleton style={{ width: '40%', height: '.75rem' }} />
        </div>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: '.75rem' }}>
        <Skeleton style={{ height: '8rem' }} />
        <Skeleton />
        <Skeleton style={{ width: '80%' }} />
      </CardContent>
    </Card>
  )
}

export function ReplacingWithContentExample() {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ display: 'grid', gap: '1rem', width: '20rem', maxWidth: '100%' }}>
      <section
        aria-label="Account details"
        aria-busy={!loaded}
      >
        {loaded ? (
          <p>Jordan Rivera. Email preferences are ready.</p>
        ) : (
          <div style={{ display: 'grid', gap: '.75rem' }}>
            <Skeleton
              style={{
                '--rad-skeleton-width': '3rem',
                '--rad-skeleton-height': '3rem',
                '--rad-skeleton-radius': '50%'
              }}
            />
            <Skeleton />
            <Skeleton style={{ width: '65%' }} />
          </div>
        )}
      </section>
      <output aria-label="Account status">{loaded ? 'Account loaded.' : 'Loading account…'}</output>
      <Button onClick={() => setLoaded(value => !value)}>
        {loaded ? 'Reload account' : 'Simulate account loaded'}
      </Button>
    </div>
  )
}
