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
