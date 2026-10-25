import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Link,
  Radio,
  RadioGroup,
  ThemeScope,
  defaultTheme,
  defineTheme,
  themes,
  type ThemeMode
} from '@cognitap/radiant'

const brand = defineTheme({
  id: 'artifact-brand',
  name: 'Artifact brand',
  tokens: {
    control: { radius: '17px' },
    color: { accent: '#125678', accentForeground: '#ffffff' }
  },
  components: { button: { radius: '21px' }, input: { radius: '19px' } }
})

function Appearance() {
  const [themeId, setTheme] = useState(themes[0].id)
  const [mode, setMode] = useState<ThemeMode>('light')
  const theme = themes.find(item => item.id === themeId)!
  const callerClass = document.body.dataset.route?.startsWith('tailwind')
    ? 'rounded-[31px] px-[23px] hover:bg-[#123456] disabled:opacity-100'
    : 'app-override'
  return (
    <main style={{ maxWidth: '48rem', padding: '1rem' }}>
      <h1 id="reset-probe">Installed style routes</h1>
      <label>
        Theme{' '}
        <select
          aria-label="Theme"
          value={themeId}
          onChange={event => setTheme(event.target.value)}
        >
          {themes.map(item => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.name}
            </option>
          ))}
        </select>
      </label>{' '}
      <label>
        Mode{' '}
        <select
          aria-label="Mode"
          value={mode}
          onChange={event => setMode(event.target.value === 'dark' ? 'dark' : 'light')}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <Button data-testid="baseline">Provider-free baseline</Button>
      <ThemeScope
        theme={theme}
        mode={mode}
        data-testid="selected"
        style={{ '--rad-input-radius': '29px', padding: '1rem' }}
      >
        <Card>
          <CardTitle>Artifact probe</CardTitle>
          <CardContent style={{ display: 'grid', gap: '1rem' }}>
            <Button data-testid="action">Action</Button>
            <Link
              href="#destination"
              variant="solid"
            >
              Action link
            </Link>
            <Field
              label="Email"
              parts={{ label: { style: { fontStyle: 'italic' } } }}
            >
              <Input
                name="email"
                defaultValue="ada@example.com"
              />
            </Field>
            <Checkbox
              label="Product updates"
              defaultChecked
            />
            <RadioGroup
              label="Plan"
              name="plan"
              defaultValue="free"
            >
              <Radio
                label="Free"
                value="free"
              />
              <Radio
                label="Pro"
                value="pro"
              />
            </RadioGroup>
            <Collapsible>
              <CollapsibleTrigger>Shipping</CollapsibleTrigger>
              <CollapsibleContent>Ships tomorrow.</CollapsibleContent>
            </Collapsible>
            <Accordion defaultValue="one">
              <AccordionItem value="one">
                <AccordionTrigger>Details</AccordionTrigger>
                <AccordionContent>Included.</AccordionContent>
              </AccordionItem>
            </Accordion>
            <Dialog>
              <DialogTrigger>Open artifact dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Artifact dialog</DialogTitle>
                <DialogDescription>Installed functional styles.</DialogDescription>
                <DialogClose>Close artifact dialog</DialogClose>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <Button
          data-testid="caller"
          className={callerClass}
        >
          Caller override
        </Button>
        <Button
          data-testid="disabled-caller"
          className={callerClass}
          disabled
        >
          Unavailable
        </Button>
        <Button
          data-testid="disabled"
          disabled
        >
          Disabled guard
        </Button>
        <Button
          data-testid="pending"
          pending
        >
          Pending guard
        </Button>
        <ThemeScope
          mode={mode}
          data-testid="inherited"
        >
          <Input aria-label="Inherited input" />
        </ThemeScope>
        <ThemeScope
          theme={brand}
          data-testid="brand"
        >
          <Button>Brand action</Button>
          <Input aria-label="Brand input" />
        </ThemeScope>
        <ThemeScope
          theme={defaultTheme}
          data-testid="reset"
        >
          <Button>Reset action</Button>
          <Input aria-label="Reset input" />
        </ThemeScope>
      </ThemeScope>
      <ThemeScope
        theme={defaultTheme}
        mode={mode}
        data-testid="sibling"
      >
        <Button>Sibling action</Button>
        <Input aria-label="Sibling input" />
      </ThemeScope>
      <p id="destination">Local destination.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Appearance />)
