import { layoutAdapter } from './layout-adapter.js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { createRoot } from 'react-dom/client'
import { animate, springValue } from 'motion'
import { MotionConfig, motion, useMotionValue } from 'motion/react'
import { SpringValue } from '@react-spring/web'
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose
} from '@cognitap/radiant'

const physics = { type: 'spring', stiffness: 260, damping: 24, mass: 1 }
const Enabled = createContext(true)
const proof = { channels: {}, hosts: {}, trace: [], commits: 0, events: [], entries: [] }
if (typeof window !== 'undefined') window.proof = proof
function channel(name, initial, enabled, apply, neutral) {
  const value = springValue(initial, physics)
  let target = initial
  let active = enabled
  const unsub = value.on('change', next => {
    apply(next)
    const output = document.querySelector(`[data-value="${name}"]`)
    if (output)
      output.textContent = `${name}: ${next.toFixed(3)} · velocity ${value.getVelocity().toFixed(2)} units/s`
    proof.trace.push({ name, value: next, velocity: value.getVelocity(), time: performance.now() })
    if (proof.trace.length > 12000) proof.trace.shift()
  })
  const result = {
    value,
    to(next) {
      target = next
      if (active) value.set(next)
      else value.jump(neutral ?? next)
    },
    enable(next) {
      active = next
      if (!next) value.jump(neutral ?? target)
    },
    destroy() {
      value.destroy()
      unsub()
    }
  }
  proof.channels[name] = result
  return result
}
function useChannel(name, initial, ref, property, neutral) {
  const enabled = useContext(Enabled)
  const control = useRef(null)
  const enabledOnMount = useRef(enabled)
  useEffect(() => {
    const node = ref.current
    proof.hosts[name] = node
    const previous = node.style[property]
    const owned = channel(
      name,
      initial,
      enabledOnMount.current,
      next => {
        node.style[property] =
          property === 'height'
            ? `${next}px`
            : property === 'translate'
              ? `${next}px 0`
              : String(next)
      },
      neutral
    )
    control.current = owned
    return () => {
      owned.destroy()
      node.style[property] = previous
      delete proof.hosts[name]
    }
  }, [ref, name, initial, property, neutral])
  useEffect(() => control.current?.enable(enabled), [enabled])
  return useCallback(next => control.current?.to(next), [])
}
function Press() {
  const node = useRef(null)
  const press = useChannel('press', 1, node, 'scale', 1)
  const [disabled, setDisabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [cancel, setCancel] = useState(false)
  const [submitted, setSubmitted] = useState('Nothing submitted')
  useEffect(() => {
    if (disabled || pending) press(1)
  }, [disabled, pending, press])
  function down(event) {
    if (cancel) event.preventDefault()
    if (!event.defaultPrevented && !disabled && !pending) press(0.9)
  }
  return (
    <section>
      <h2>1 · Real Radiant Button</h2>
      <p>
        Presentation only: native submit, keyboard and caller transform stay owned by the button.
      </p>
      <form
        onSubmit={event => {
          event.preventDefault()
          const data = new FormData(event.currentTarget, event.nativeEvent.submitter)
          setSubmitted(`${data.get('intent')}`)
          proof.events.push('submit')
        }}
      >
        <Button
          ref={node}
          type="submit"
          name="intent"
          value="save"
          disabled={disabled}
          pending={pending}
          style={{
            transform: 'rotate(8deg)',
            '--rad-button-press-scale': '1',
            '--rad-button-hover-lift': '0px'
          }}
          onPointerDown={down}
          onPointerUp={() => press(1)}
          onPointerLeave={() => press(1)}
          onPointerCancel={() => press(1)}
          onLostPointerCapture={() => press(1)}
          onBlur={() => press(1)}
          onKeyDown={event => {
            if (!event.repeat && [' ', 'Enter'].includes(event.key)) down(event)
          }}
          onKeyUp={event => {
            if ([' ', 'Enter'].includes(event.key)) press(1)
          }}
        >
          Spring submit
        </Button>
      </form>
      <output>{submitted}</output>
      <output data-value="press">press: 1 · velocity 0</output>
      <label>
        <input
          type="checkbox"
          checked={disabled}
          onChange={e => setDisabled(e.target.checked)}
        />
        Disabled button
      </label>
      <label>
        <input
          type="checkbox"
          checked={pending}
          onChange={e => setPending(e.target.checked)}
        />
        Pending button
      </label>
      <label>
        <input
          type="checkbox"
          checked={cancel}
          onChange={e => setCancel(e.target.checked)}
        />
        Caller prevents press
      </label>
    </section>
  )
}
function Disclosure() {
  const [open, setOpen] = useState(false)
  const [extra, setExtra] = useState(false)
  const panel = useRef(null)
  const inner = useRef(null)
  const height = useChannel('disclosure', 0, panel, 'height')
  useEffect(() => {
    height(open ? inner.current.scrollHeight : 0)
  }, [open, extra, height])
  useEffect(() => {
    const observer = new ResizeObserver(() => height(open ? inner.current.scrollHeight : 0))
    observer.observe(inner.current)
    return () => observer.disconnect()
  }, [open, height])
  return (
    <section>
      <h2>2 · Interrupted native details</h2>
      <p>
        The native open state changes immediately. The clipped panel is inert and hidden from
        accessibility when closed; only its visual height can finish.
      </p>
      <Collapsible
        className="spring-details"
        open={open}
        onOpenChange={next => {
          proof.events.push(`details:${next}`)
          setOpen(next)
        }}
      >
        <CollapsibleTrigger>Spring disclosure</CollapsibleTrigger>
        <CollapsibleContent
          ref={panel}
          inert={!open}
          aria-hidden={!open}
          style={{ height: '0px', overflow: 'clip', padding: '0px' }}
        >
          <div
            ref={inner}
            className="inside"
          >
            <p>Reverse direction before the panel settles.</p>
            <Button onClick={() => setExtra(!extra)}>Change content size</Button>
            {extra && (
              <p>
                Live content adds another measured block. The spring follows the new height without
                resetting its current position or velocity.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <output data-value="disclosure">disclosure: 0 · velocity 0</output>
    </section>
  )
}
function Drag() {
  const x = useMotionValue(0)
  const enabled = useContext(Enabled)
  const cancelled = useRef(false)
  useEffect(() => {
    proof.channels.drag = { value: x }
    return () => x.stop()
  }, [x])
  useEffect(() => {
    if (!enabled) x.jump(0)
  }, [enabled, x])
  const snap = (target, velocity = x.getVelocity()) =>
    enabled ? animate(x, target, { ...physics, velocity }) : x.jump(target)
  return (
    <section>
      <h2>3 · Drag, release and snap</h2>
      <p>
        Horizontal pointer/touch drag, momentum-aware spring release, arrow-key alternative. Escape
        returns to centre.
      </p>
      <div className="track">
        <motion.button
          aria-label="Move spring marker"
          drag={enabled ? 'x' : false}
          dragConstraints={{ left: -120, right: 120 }}
          dragMomentum={false}
          style={{ x, touchAction: 'pan-y' }}
          onPointerDown={() => {
            cancelled.current = false
          }}
          onDragEnd={(_, info) => {
            proof.events.push({ dragVelocity: info.velocity.x, cancelled: cancelled.current })
            snap(
              cancelled.current ? 0 : Math.max(-120, Math.min(120, Math.round(x.get() / 80) * 80)),
              cancelled.current ? 0 : info.velocity.x
            )
          }}
          onPointerCancel={() => {
            cancelled.current = true
            snap(0, 0)
          }}
          onKeyDown={event => {
            if (['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
              event.preventDefault()
              snap(
                event.key === 'Escape'
                  ? 0
                  : Math.max(-120, Math.min(120, x.get() + (event.key === 'ArrowRight' ? 80 : -80)))
              )
            }
          }}
        >
          Drag me
        </motion.button>
      </div>
    </section>
  )
}
function Following() {
  const ref = useRef(null)
  const follow = useChannel('following', 0, ref, 'translate')
  useEffect(() => {
    proof.commits++
  })
  return (
    <section>
      <h2>4 · Changing targets</h2>
      <p>
        Move across the track or choose a target. Raw values update the DOM without a React render
        per animation frame.
      </p>
      <div
        className="follow-track"
        onPointerMove={event =>
          follow(
            Math.max(
              0,
              Math.min(220, event.clientX - event.currentTarget.getBoundingClientRect().left - 20)
            )
          )
        }
      >
        <span
          ref={ref}
          className="dot"
        />
      </div>
      <Button onClick={() => follow(220)}>Follow right</Button>
      <Button onClick={() => follow(0)}>Follow left</Button>
      <output data-value="following">following: 0 · velocity 0</output>
    </section>
  )
}
function Layout() {
  const [order, setOrder] = useState(['Alpha', 'Beta', 'Gamma'])
  const [wide, setWide] = useState(false)
  const enabled = useContext(Enabled)
  const container = useRef(null)
  const adapters = useRef(new Map())
  useLayoutEffect(() => {
    const measure = () => {
      const root = container.current
      const bounds = root.getBoundingClientRect()
      for (const slot of root.querySelectorAll('[data-slot-name]')) {
        const host = slot.querySelector('[data-item]')
        const rect = slot.getBoundingClientRect()
        const next = {
          x: rect.left - bounds.left,
          y: rect.top - bounds.top,
          width: rect.width,
          height: rect.height
        }
        let adapter = adapters.current.get(slot.dataset.slotName)
        if (!adapter) {
          adapter = layoutAdapter(
            next,
            value => {
              host.style.translate = `${value.x}px ${value.y}px`
              host.style.width = `${value.width}px`
              host.style.height = `${value.height}px`
            },
            physics
          )
          adapters.current.set(slot.dataset.slotName, adapter)
        }
        adapter.to(next, enabled)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [order, wide, enabled])
  useEffect(() => {
    const owned = adapters.current
    proof.layout = {
      reverse: () => setOrder(current => [...current].reverse()),
      resize: () => setWide(current => !current),
      values: () =>
        Object.fromEntries(
          [...owned].map(([name, adapter]) => [
            name,
            Object.fromEntries(
              Object.entries(adapter.values).map(([axis, value]) => [
                axis,
                { position: value.get(), velocity: value.getVelocity() }
              ])
            )
          ])
        )
    }
    return () => {
      owned.forEach(adapter => adapter.destroy())
      owned.clear()
      delete proof.layout
    }
  }, [])
  return (
    <section>
      <h2>5 · Layout resize and reorder</h2>
      <p>
        Radiant measures natural-flow slots and preserves Motion spring values per pixel axis.
        Dedicated motion parts own translate and dimensions; native inner buttons keep caller
        transforms.
      </p>
      <Button onClick={() => setOrder([...order].reverse())}>Reverse list</Button>
      <Button onClick={() => setWide(!wide)}>Resize layout</Button>
      <ol
        ref={container}
        data-layout="surface"
        style={{
          position: 'relative',
          width: wide ? 300 : 230,
          padding: 0,
          margin: 0,
          listStyle: 'none'
        }}
      >
        {order.map(name => (
          <li
            key={name}
            data-slot-name={name}
            style={{ height: wide ? 84 : 64 }}
          >
            <div
              data-item={name}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'clip' }}
            >
              <Button style={{ transform: 'rotate(3deg)' }}>{name}</Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
function Modal() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const scale = useChannel('dialog', 1, ref, 'scale', 1)
  const enabled = useContext(Enabled)
  useEffect(() => {
    if (open && enabled) {
      proof.channels.dialog.value.jump(0.94)
      scale(1)
    } else proof.channels.dialog.value.jump(1)
  }, [open, enabled, scale])
  return (
    <section>
      <h2>6 · Native Dialog lifecycle boundary</h2>
      <p>
        Spring entry, immediate native dismissal and cancellation. This does not claim a retained
        top-layer spring exit; that requires a separate presence decision in DEV-174.
      </p>
      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogTrigger>Open native dialog</DialogTrigger>
        <DialogContent
          ref={ref}
          style={{ transform: 'rotate(2deg)' }}
        >
          <DialogTitle>Native modal stays native</DialogTitle>
          <input aria-label="Dialog field" />
          <DialogClose>Close native dialog</DialogClose>
        </DialogContent>
      </Dialog>
      <output data-value="dialog">dialog: 1 · velocity 0</output>
    </section>
  )
}
function useReducedPreference() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}
function App() {
  const [off, setOff] = useState(false)
  const reduced = useReducedPreference()
  const enabled = !off && !reduced
  return (
    <Enabled.Provider value={enabled}>
      <MotionConfig reducedMotion="user">
        <main data-motion={enabled ? 'spring' : 'off'}>
          <h1>Spring engine suitability proof</h1>
          <p>
            DEV-171 · installed Radiant 0.0.5 · Motion 14.7.1 · research fixture, not a production
            API.
          </p>
          <label>
            <input
              type="checkbox"
              checked={off}
              onChange={e => setOff(e.target.checked)}
            />
            Motion off
          </label>
          <output>Effective motion: {enabled ? 'spring' : 'off'}</output>
          <Press />
          <Disclosure />
          <Drag />
          <Following />
          <Layout />
          <Modal />
        </main>
      </MotionConfig>
    </Enabled.Provider>
  )
}
if (typeof window !== 'undefined') {
  proof.compare = {
    motion: () => {
      const c = channel('compare-motion', 0, true, () => {})
      c.to(100)
      return c
    },
    spring: () => {
      const value = new SpringValue(0)
      value.start({ to: 100, config: { tension: 260, friction: 24, mass: 1 } })
      const c = {
        value,
        to: next => value.start({ to: next, config: { tension: 260, friction: 24, mass: 1 } }),
        destroy: () => value.stop()
      }
      proof.channels['compare-spring'] = c
      return c
    }
  }
  const root = createRoot(document.getElementById('root'))
  root.render(<App />)
  proof.unmount = () => {
    root.unmount()
    Object.values(proof.channels).forEach(c => {
      c.destroy?.()
      c.value.stop()
    })
  }
}
export { App }
