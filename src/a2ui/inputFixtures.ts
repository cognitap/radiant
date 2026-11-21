import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const TRIP_SURFACE_ID = 'trip_request'

const check = (flag: string, message: string) => [
  { condition: { '@path': `/validity/${flag}` }, message }
]

/**
 * Recorded A2UI 1.0 fixture with every basic-catalog input bound to the data model, a `checks`
 * rule on each, and one action whose `context` carries the bound values to the agent.
 */
export const tripRequestFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: TRIP_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      dataModel: {
        trip: {
          traveler: '',
          departureDate: '',
          departureTime: '',
          returnAt: '',
          cabin: ['economy'],
          extras: [],
          bags: 1,
          acceptRules: false
        },
        validity: {
          traveler: true,
          departureDate: true,
          departureTime: true,
          returnAt: true,
          cabin: true,
          extras: true,
          bags: true,
          acceptRules: true
        }
      },
      components: [
        {
          id: 'root',
          component: 'Column',
          children: [
            'traveler_field',
            'departure_date',
            'departure_time',
            'return_at',
            'cabin_picker',
            'extras_picker',
            'bags_slider',
            'rules_checkbox',
            'submit_button'
          ]
        },
        {
          id: 'traveler_field',
          component: 'TextField',
          label: 'Traveler name',
          value: { '@path': '/trip/traveler' },
          checks: check('traveler', 'Enter the name shown on the passport.')
        },
        {
          id: 'departure_date',
          component: 'DateTimeInput',
          label: 'Departure date',
          enableDate: true,
          min: '2026-01-01',
          max: '2027-12-31',
          value: { '@path': '/trip/departureDate' },
          checks: check('departureDate', 'Choose a date with seats left.')
        },
        {
          id: 'departure_time',
          component: 'DateTimeInput',
          label: 'Earliest departure time',
          enableTime: true,
          value: { '@path': '/trip/departureTime' },
          checks: check('departureTime', 'No flights leave that early.')
        },
        {
          id: 'return_at',
          component: 'DateTimeInput',
          label: 'Return flight',
          enableDate: true,
          enableTime: true,
          value: { '@path': '/trip/returnAt' },
          checks: check('returnAt', 'Return after the departure.')
        },
        {
          id: 'cabin_picker',
          component: 'ChoicePicker',
          label: 'Cabin',
          variant: 'mutuallyExclusive',
          options: [
            { label: 'Economy', value: 'economy' },
            { label: 'Business', value: 'business' }
          ],
          value: { '@path': '/trip/cabin' },
          checks: check('cabin', 'Business is sold out on this date.')
        },
        {
          id: 'extras_picker',
          component: 'ChoicePicker',
          label: 'Extras',
          variant: 'multipleSelection',
          options: [
            { label: 'Meal', value: 'meal' },
            { label: 'Wi-Fi', value: 'wifi' }
          ],
          value: { '@path': '/trip/extras' },
          checks: check('extras', 'Wi-Fi is not offered on this route.')
        },
        {
          id: 'bags_slider',
          component: 'Slider',
          label: 'Checked bags',
          min: 0,
          max: 3,
          steps: 3,
          value: { '@path': '/trip/bags' },
          checks: check('bags', 'This fare allows two bags.')
        },
        {
          id: 'rules_checkbox',
          component: 'CheckBox',
          label: 'I accept the fare rules',
          value: { '@path': '/trip/acceptRules' },
          checks: check('acceptRules', 'Accept the fare rules to book.')
        },
        {
          id: 'submit_button',
          component: 'Button',
          variant: 'primary',
          child: 'submit_label',
          action: {
            event: {
              name: 'request_trip',
              context: {
                traveler: { '@path': '/trip/traveler' },
                departureDate: { '@path': '/trip/departureDate' },
                departureTime: { '@path': '/trip/departureTime' },
                returnAt: { '@path': '/trip/returnAt' },
                cabin: { '@path': '/trip/cabin' },
                extras: { '@path': '/trip/extras' },
                bags: { '@path': '/trip/bags' },
                acceptRules: { '@path': '/trip/acceptRules' }
              }
            }
          }
        },
        { id: 'submit_label', component: 'Text', text: 'Request trip' }
      ]
    }
  }
]

/** The agent's reply to `request_trip`: every check fails, so each input shows its message. */
export const tripRequestRejectionMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    updateDataModel: {
      surfaceId: TRIP_SURFACE_ID,
      path: '/validity',
      value: {
        traveler: false,
        departureDate: false,
        departureTime: false,
        returnAt: false,
        cabin: false,
        extras: false,
        bags: false,
        acceptRules: false
      }
    }
  }
]
