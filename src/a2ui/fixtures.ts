import { A2UI_BASIC_CATALOG_ID, A2UI_PROTOCOL_VERSION } from './catalogGenerator.js'
import type { A2uiMessage } from './sanitize.js'

export const PROFILE_SURFACE_ID = 'profile_editor'

/**
 * Recorded A2UI 1.0 tracer-bullet fixture containing Text, a data-bound TextField,
 * and a Button whose action emits an event carrying the bound value in `context`.
 */
export const profileFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: PROFILE_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      dataModel: {
        profile: {
          displayName: 'Ada Lovelace'
        }
      },
      components: [
        {
          id: 'root',
          component: 'Column',
          children: ['intro_text', 'caption_text', 'name_field', 'save_button']
        },
        {
          id: 'intro_text',
          component: 'Text',
          text: 'Update how your name appears across shared workspaces.',
          variant: 'body'
        },
        {
          id: 'caption_text',
          component: 'Text',
          text: 'Changes apply immediately after saving.',
          variant: 'caption'
        },
        {
          id: 'name_field',
          component: 'TextField',
          label: 'Display name',
          placeholder: 'Enter your name',
          value: { '@path': '/profile/displayName' },
          variant: 'shortText'
        },
        {
          id: 'save_button',
          component: 'Button',
          child: 'save_button_label',
          variant: 'primary',
          action: {
            event: {
              name: 'save_profile',
              context: {
                displayName: { '@path': '/profile/displayName' }
              }
            }
          }
        },
        {
          id: 'save_button_label',
          component: 'Text',
          text: 'Save profile'
        }
      ]
    }
  }
]

/**
 * Same recorded A2UI 1.0 fixture carrying agent-supplied theme hints that Radiant must ignore.
 */
export const profileFixtureWithThemeHintMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      ...(profileFixtureMessages[0]!.createSurface as Record<string, unknown>),
      theme: {
        primaryColor: '#ff00ff',
        font: 'Comic Sans MS'
      }
    }
  }
]

/**
 * Recorded A2UI 1.0 fixture with malformed model output: invalid enums, missing required label,
 * mixed controlled/uncontrolled state (`value` + `defaultValue`), forbidden host props,
 * non-string text, and an unknown component that must degrade to text without throwing.
 */
export const malformedProfileFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: PROFILE_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      dataModel: {
        profile: {
          displayName: 'Ada Lovelace'
        }
      },
      components: [
        {
          id: 'root',
          component: 'Column',
          align: 'middle',
          children: ['intro_text', 'unknown_banner', 'name_field', 'save_button']
        },
        {
          id: 'intro_text',
          component: 'Text',
          text: 42,
          variant: 'giant',
          className: 'bg-red-500'
        },
        {
          id: 'unknown_banner',
          component: 'PromoBanner',
          text: 'Workspace settings remain available.'
        },
        {
          id: 'name_field',
          component: 'TextField',
          value: { '@path': '/profile/displayName' },
          defaultValue: 'Grace Hopper',
          variant: 'email',
          style: { color: 'red' }
        },
        {
          id: 'save_button',
          component: 'Button',
          variant: 'neon',
          child: 'save_button_label',
          action: {
            event: {
              name: 'save_profile',
              context: {
                displayName: { '@path': '/profile/displayName' }
              }
            }
          }
        },
        {
          id: 'save_button_label',
          component: 'Text',
          text: 'Save profile'
        }
      ]
    }
  }
]

export const PREFERENCES_SURFACE_ID = 'workspace_preferences'

/**
 * Recorded A2UI 1.0 fixture combining several client-local controls (TextField, ChoicePicker,
 * Slider, CheckBox) with one named outbound action that delivers a surface state snapshot.
 */
export const interactivePreferencesFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: PREFERENCES_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      dataModel: {
        note: '',
        cadence: ['daily'],
        channels: ['email'],
        volume: 40,
        notify: false
      },
      components: [
        {
          id: 'root',
          component: 'Column',
          children: [
            'note_field',
            'cadence_picker',
            'channel_picker',
            'volume_slider',
            'notify_checkbox',
            'apply_button'
          ]
        },
        {
          id: 'note_field',
          component: 'TextField',
          label: 'Summary note',
          placeholder: 'Add a short note',
          value: { '@path': '/note' },
          variant: 'shortText'
        },
        {
          id: 'cadence_picker',
          component: 'ChoicePicker',
          label: 'Digest cadence',
          variant: 'mutuallyExclusive',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' }
          ],
          value: { '@path': '/cadence' }
        },
        {
          id: 'channel_picker',
          component: 'ChoicePicker',
          label: 'Delivery channels',
          variant: 'multipleSelection',
          options: [
            { label: 'Email', value: 'email' },
            { label: 'In-app', value: 'in_app' }
          ],
          value: { '@path': '/channels' }
        },
        {
          id: 'volume_slider',
          component: 'Slider',
          label: 'Alert volume',
          min: 0,
          max: 100,
          steps: 10,
          value: { '@path': '/volume' }
        },
        {
          id: 'notify_checkbox',
          component: 'CheckBox',
          label: 'Enable quiet hours',
          value: { '@path': '/notify' }
        },
        {
          id: 'apply_button',
          component: 'Button',
          variant: 'primary',
          child: 'apply_button_label',
          action: {
            event: {
              name: 'apply_preferences'
            }
          }
        },
        {
          id: 'apply_button_label',
          component: 'Text',
          text: 'Apply preferences'
        }
      ]
    }
  }
]

export const INACCESSIBLE_SURFACE_ID = 'inaccessible_signup'

/**
 * A2UI 1.0 fixture that fails `validateA2uiAccessibility`: unlabeled controls (some fixable from
 * author text), a button with no text, and a patch that adds another unlabeled control.
 */
export const inaccessibleFixtureMessages: readonly A2uiMessage[] = [
  {
    version: A2UI_PROTOCOL_VERSION,
    createSurface: {
      surfaceId: INACCESSIBLE_SURFACE_ID,
      catalogId: A2UI_BASIC_CATALOG_ID,
      components: [
        {
          id: 'root',
          component: 'Column',
          children: ['email_field', 'terms_checkbox', 'plan_picker', 'submit_button']
        },
        {
          id: 'email_field',
          component: 'TextField',
          placeholder: 'Email address',
          value: { '@path': '/email' }
        },
        {
          id: 'terms_checkbox',
          component: 'CheckBox',
          accessibility: { label: 'Accept the terms' },
          value: false
        },
        {
          id: 'plan_picker',
          component: 'ChoicePicker',
          accessibility: { label: 'Plan' },
          options: [{ label: 'Free', value: 'free' }],
          value: ['free']
        },
        {
          id: 'submit_button',
          component: 'Button',
          child: 'submit_icon',
          action: { event: { name: 'submit' } }
        },
        { id: 'submit_icon', component: 'Text', text: ' ' }
      ]
    }
  },
  {
    version: A2UI_PROTOCOL_VERSION,
    updateComponents: {
      surfaceId: INACCESSIBLE_SURFACE_ID,
      components: [
        {
          id: 'root',
          component: 'Column',
          children: [
            'email_field',
            'terms_checkbox',
            'plan_picker',
            'seats_slider',
            'submit_button'
          ]
        },
        { id: 'seats_slider', component: 'Slider', min: 1, max: 10, value: 1 }
      ]
    }
  }
]
