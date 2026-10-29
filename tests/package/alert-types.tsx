import { createElement as h, createRef } from 'react'
import {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertProps,
  type AlertAnnouncement,
  type AlertTone,
  type AlertHeadingLevel
} from '@cognitap/radiant'
const announcement: AlertAnnouncement = 'polite'
const tone: AlertTone = 'danger'
const level: AlertHeadingLevel = 3
h(
  Alert,
  {
    announce: announcement,
    tone,
    ref: createRef<HTMLDivElement>(),
    style: { '--rad-alert-padding': '1rem' },
    'aria-label': 'Save result'
  },
  h(AlertTitle, { level, ref: createRef<HTMLHeadingElement>() }, 'Could not save'),
  h(AlertDescription, { ref: createRef<HTMLParagraphElement>() }, 'Try again.')
)
// @ts-expect-error Announcement roles are owned by Alert.
const role: AlertProps = { role: 'alert' }
// @ts-expect-error Urgency is selected through announce.
const live: AlertProps = { 'aria-live': 'assertive' }
// @ts-expect-error Only supported announcement modes are accepted.
const invalid: AlertProps = { announce: 'always' }
void [role, live, invalid]
