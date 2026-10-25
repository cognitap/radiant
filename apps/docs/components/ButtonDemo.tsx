'use client'

import { useState } from 'react'
import { Button } from '@cognitap/radiant'

export function ButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <div className="button-demo">
      <div className="demo-canvas">
        <Button onClick={() => setCount(value => value + 1)}>
          Try Radiant <span aria-hidden="true">↗</span>
        </Button>
        <output>
          {count === 0
            ? 'Ready when you are.'
            : `Activated ${count} ${count === 1 ? 'time' : 'times'}.`}
        </output>
      </div>
      <div className="demo-caption">
        <span>Live example</span>
        <span>React · Current source</span>
      </div>
    </div>
  )
}
