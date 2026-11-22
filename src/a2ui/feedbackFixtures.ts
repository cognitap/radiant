import { A2UI_PROTOCOL_VERSION, RADIANT_A2UI_EXTENSION_CATALOG_ID } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const FEEDBACK_SURFACE_ID = 'order_status'
export const TOAST_SURFACE_ID = 'draft_editor'

const surface = (
  surfaceId: string,
  dataModel: Record<string, unknown>,
  components: readonly Record<string, unknown>[]
): readonly A2uiMessage[] => [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId,
      catalogId: RADIANT_A2UI_EXTENSION_CATALOG_ID,
      dataModel,
      components
    }
  }
]

const label = (id: string, text: string) => ({ id, component: 'Text', text })

/** A polite warning Alert with a follow-up Button. */
export const alertFixtureMessages = surface(FEEDBACK_SURFACE_ID, {}, [
  {
    id: 'root',
    component: 'Alert',
    title: 'Payment is late',
    description: 'We will retry the card tomorrow.',
    tone: 'warning',
    announce: 'polite',
    actions: ['retry']
  },
  {
    id: 'retry',
    component: 'Button',
    child: 'retry_label',
    action: { event: { name: 'retry_payment' } }
  },
  label('retry_label', 'Retry now')
])

/** Badges labeling a heading, one bound to the data model. */
export const badgeFixtureMessages = surface(FEEDBACK_SURFACE_ID, { status: 'Shipped' }, [
  { id: 'root', component: 'Row', align: 'center', children: ['order', 'status', 'count'] },
  label('order', 'Order 1042'),
  { id: 'status', component: 'Badge', text: { '@path': '/status' }, tone: 'accent' },
  { id: 'count', component: 'Badge', text: '3 items' }
])

/** Progress whose value comes from the data model. */
export const progressFixtureMessages = surface(FEEDBACK_SURFACE_ID, { upload: { done: 40 } }, [
  {
    id: 'root',
    component: 'Progress',
    label: 'Uploading invoice',
    value: { '@path': '/upload/done' },
    max: 100
  }
])

/** Accordion whose items name their panels and whose open sections are bound. */
export const accordionFixtureMessages = surface(FEEDBACK_SURFACE_ID, { open: ['shipping'] }, [
  {
    id: 'root',
    component: 'Accordion',
    selection: 'multiple',
    items: [
      { value: 'shipping', title: 'Shipping', panel: 'shipping_text' },
      { value: 'returns', title: 'Returns', panel: 'returns_text' }
    ],
    value: { '@path': '/open' }
  },
  label('shipping_text', 'Ships within two days.'),
  label('returns_text', 'Return within 30 days.')
])

/** Table templated over `/invoices`; each Row's cells read item-relative paths. */
export const tableFixtureMessages = surface(
  FEEDBACK_SURFACE_ID,
  {
    invoices: [
      { number: 'INV-1', customer: 'Ada Lovelace', amount: '€120.00', status: 'Paid' },
      { number: 'INV-2', customer: 'Alan Turing', amount: '€80.50', status: 'Due' }
    ]
  },
  [
    {
      id: 'root',
      component: 'Table',
      caption: 'Invoices',
      density: 'tight',
      columns: [
        { label: 'Number' },
        { label: 'Customer' },
        { label: 'Amount', align: 'end' },
        { label: 'Status' }
      ],
      rows: { componentId: 'invoice_row', path: '/invoices' }
    },
    {
      id: 'invoice_row',
      component: 'Row',
      children: ['invoice_number', 'invoice_customer', 'invoice_amount', 'invoice_status']
    },
    { id: 'invoice_number', component: 'Text', text: { '@path': 'number' } },
    { id: 'invoice_customer', component: 'Text', text: { '@path': 'customer' } },
    { id: 'invoice_amount', component: 'Text', text: { '@path': 'amount' } },
    { id: 'invoice_status', component: 'Badge', text: { '@path': 'status' } }
  ]
)

/** A Button whose action the host answers by setting the Toast's bound `open` to true. */
export const toastFixtureMessages = surface(TOAST_SURFACE_ID, { toasts: { saved: false } }, [
  { id: 'root', component: 'Column', children: ['save', 'saved_toast'] },
  {
    id: 'save',
    component: 'Button',
    variant: 'primary',
    child: 'save_label',
    action: { event: { name: 'save_draft' } }
  },
  label('save_label', 'Save draft'),
  {
    id: 'saved_toast',
    component: 'Toast',
    open: { '@path': '/toasts/saved' },
    title: 'Draft saved',
    tone: 'accent',
    duration: 5000,
    actionLabel: 'Undo',
    action: { event: { name: 'undo_save' } }
  }
])

/** The host's reply to `save_draft`: it raises the toast. */
export const toastRaisedFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    updateDataModel: { surfaceId: TOAST_SURFACE_ID, path: '/toasts/saved', value: true }
  }
]
