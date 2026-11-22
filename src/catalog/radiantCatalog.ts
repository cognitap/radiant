import {
  CATALOG_ALIGNMENTS,
  CATALOG_ANNOUNCEMENTS,
  CATALOG_CONTROL_SIZES,
  CATALOG_JUSTIFY,
  CATALOG_ORIENTATIONS,
  CATALOG_SPACING,
  CATALOG_TONES,
  CATALOG_VARIANTS,
  CHOICE_PRESENTATIONS,
  type Catalog,
  type CatalogJsonSchema
} from './types.js'
import { defineCatalog } from './validate.js'

const spacingSchema: CatalogJsonSchema = {
  type: 'string',
  enum: CATALOG_SPACING,
  default: 'normal',
  description: 'Semantic spacing scale owned by Radiant.'
}

const toneSchema = (defaultTone: (typeof CATALOG_TONES)[number]): CatalogJsonSchema => ({
  type: 'string',
  enum: CATALOG_TONES,
  default: defaultTone,
  description: 'Semantic palette intent.'
})

const controlSizeSchema: CatalogJsonSchema = {
  type: 'string',
  enum: CATALOG_CONTROL_SIZES,
  default: 'medium',
  description: 'Shared interactive control size.'
}

const seriesSchema: CatalogJsonSchema = {
  type: 'integer',
  minimum: 1,
  maximum: 8,
  description: 'Categorical color from 1 to 8; one number per concept.'
}

const childWeightSchema: CatalogJsonSchema = {
  type: 'number',
  exclusiveMinimum: 0,
  description: 'Relative flex growth weight along the parent main axis.'
}

const choiceOptionSchema: CatalogJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['value', 'label'],
  properties: {
    value: { type: 'string', minLength: 1, description: 'Stable option value.' },
    label: { type: 'string', minLength: 1, description: 'Visible option label.' },
    description: { type: 'string', description: 'Optional supporting detail for the option.' },
    disabled: { type: 'boolean', default: false, description: 'Prevents selecting this option.' }
  }
}

const matrixSeriesSchema: CatalogJsonSchema = {
  type: 'integer',
  minimum: 1,
  maximum: 8,
  description: 'Categorical color from the theme series, 1 to 8.'
}

const matrixHeaderSchema = (description: string): CatalogJsonSchema => ({
  type: 'object',
  additionalProperties: false,
  required: ['label'],
  properties: { label: { type: 'string', minLength: 1, description } }
})

const matrixCellSchema: CatalogJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text: { type: 'string', description: 'Visible cell contents.' },
    value: {
      type: 'string',
      minLength: 1,
      description: 'Stable value; selectable when `selection` is single or multiple.'
    },
    state: {
      type: 'string',
      enum: ['active', 'muted', 'highlighted'],
      description: 'Emphasis: active stands out, highlighted draws attention, muted steps back.'
    },
    series: matrixSeriesSchema,
    marker: {
      type: 'object',
      additionalProperties: false,
      description: 'A round mark in the cell, with optional short text.',
      properties: {
        text: { type: 'string', maxLength: 3, description: 'Short text inside the mark.' },
        ring: {
          type: 'boolean',
          default: false,
          description: 'Draws a ring instead of a filled mark, for an open or empty one.'
        }
      }
    },
    description: {
      type: 'string',
      description: 'Announced instead of the contents, for cells that only hold a marker.'
    },
    disabled: { type: 'boolean', default: false, description: 'Prevents selecting the cell.' }
  }
}

export const RADIANT_CATALOG_ID = 'radiant/canonical'
export const RADIANT_CATALOG_VERSION = '1.0.0'

/**
 * Radiant's canonical, protocol-independent model-facing catalog.
 * Protocol adapters translate these intent-oriented entries rather than defining their own.
 */
export const radiantCatalog: Catalog = defineCatalog({
  id: RADIANT_CATALOG_ID,
  version: RADIANT_CATALOG_VERSION,
  description:
    'Canonical model-facing contract for Radiant UI surfaces. Independent of wire protocol and host implementation.',
  entries: {
    Text: {
      name: 'Text',
      category: 'content',
      description: 'Displays formatted text with semantic typographic hierarchy.',
      guidance: {
        whenToUse:
          'Headings, body copy, captions and inline code. Choose `variant` for hierarchy, not size.',
        whenNotToUse: 'Toned status messages (Alert), short labels (Badge) or button labels.',
        examples: ['section heading, `variant: h2`', 'note under a table, `variant: caption`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Text content to display.' },
          variant: {
            type: 'string',
            enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'body', 'caption', 'code'],
            default: 'body',
            description: 'Semantic typographic hierarchy.'
          },
          tone: toneSchema('neutral')
        }
      },
      slots: {},
      bindings: {
        text: {
          description: 'Optional dynamic text value read from surface state.',
          valueType: 'string',
          direction: 'read'
        }
      },
      actions: {}
    },

    Icon: {
      name: 'Icon',
      category: 'media',
      description: 'Displays a named vector icon from the host icon registry.',
      guidance: {
        whenToUse:
          'A registered icon that adds meaning beside text, or stands alone with a `label`.',
        whenNotToUse:
          'Photos or illustrations (Image). Omit `label` when adjacent text says the same.',
        examples: [
          'warning glyph before a note, `name: warning`',
          'standalone status, `name: check`, `label: Downloaded`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, description: 'Registered icon identifier.' },
          label: {
            type: 'string',
            description:
              'Accessible name when the icon conveys standalone meaning. Omit for decorative icons.'
          },
          tone: toneSchema('neutral'),
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    },

    Image: {
      name: 'Image',
      category: 'media',
      description: 'Displays an image with explicit alternative text and aspect behavior.',
      guidance: {
        whenToUse:
          'Photos, illustrations and avatars. Set `usage` for size intent and `alt` for meaning.',
        whenNotToUse:
          'Registered icons (Icon) or tabular data (Table). Leave `alt` empty only for decoration.',
        examples: [
          'product photo, `usage: mediumFeature`, `fit: cover`',
          'profile picture, `usage: avatar`, `alt` naming the person'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'alt'],
        properties: {
          url: { type: 'string', format: 'uri', description: 'Image source URL.' },
          alt: {
            type: 'string',
            description: 'Alternative text describing the image, or empty string if decorative.'
          },
          fit: {
            type: 'string',
            enum: ['contain', 'cover', 'fill', 'none', 'scale-down'],
            default: 'cover',
            description: 'How the image fits inside its frame.'
          },
          usage: {
            type: 'string',
            enum: ['icon', 'avatar', 'smallFeature', 'mediumFeature', 'largeFeature', 'header'],
            default: 'mediumFeature',
            description: 'Semantic presentation size hint.'
          }
        }
      },
      slots: {},
      bindings: {
        url: {
          description: 'Optional reactive image URL from surface state.',
          valueType: 'string',
          direction: 'read'
        }
      },
      actions: {}
    },

    Video: {
      name: 'Video',
      category: 'media',
      description: 'Plays a video clip with native browser controls.',
      guidance: {
        whenToUse: 'A video clip the user starts, with a descriptive `title`.',
        whenNotToUse: 'Still images (Image), audio only (AudioPlayer) or decorative motion.',
        examples: [
          'product walkthrough with a `poster` frame',
          'recorded lecture, `title` naming the topic'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'title'],
        properties: {
          url: { type: 'string', format: 'uri', description: 'Video media source URL.' },
          title: { type: 'string', minLength: 1, description: 'Accessible title for the video.' },
          poster: { type: 'string', format: 'uri', description: 'Optional poster frame image URL.' }
        }
      },
      slots: {},
      bindings: {
        url: {
          description: 'Optional reactive video URL from surface state.',
          valueType: 'string',
          direction: 'read'
        }
      },
      actions: {}
    },

    AudioPlayer: {
      name: 'AudioPlayer',
      category: 'media',
      description: 'Plays an audio track with play, pause, a scrubber and the time.',
      guidance: {
        whenToUse: 'An audio track with a visible `title`, such as a podcast or voice note.',
        whenNotToUse: 'Video (Video) or sounds tied to actions.',
        examples: [
          'podcast episode with a `description`',
          'pronunciation sample, `title` naming the word'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'title'],
        properties: {
          url: { type: 'string', format: 'uri', description: 'Audio media source URL.' },
          title: {
            type: 'string',
            minLength: 1,
            description: 'Visible and accessible title for the audio track.'
          },
          description: { type: 'string', description: 'Optional description of the audio.' }
        }
      },
      slots: {},
      bindings: {
        url: {
          description: 'Optional reactive audio URL from surface state.',
          valueType: 'string',
          direction: 'read'
        }
      },
      actions: {}
    },

    Row: {
      name: 'Row',
      category: 'layout',
      description: 'Arranges child elements horizontally with semantic spacing and alignment.',
      guidance: {
        whenToUse: 'A few peers side by side: actions, a label and value, or cards.',
        whenNotToUse:
          'Stacked content (Column) or repeated data (List, Table). Set `wrap` when items may not fit.',
        examples: [
          'Cancel and Save buttons, `justify: end`',
          'metric cards, `gap: airy`, `wrap: true`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          gap: spacingSchema,
          justify: {
            type: 'string',
            enum: CATALOG_JUSTIFY,
            default: 'start',
            description: 'Main-axis distribution of children.'
          },
          align: {
            type: 'string',
            enum: CATALOG_ALIGNMENTS,
            default: 'stretch',
            description: 'Cross-axis alignment of children.'
          },
          wrap: {
            type: 'boolean',
            default: false,
            description: 'Allows children to wrap onto multiple lines when space is narrow.'
          }
        }
      },
      slots: {
        children: {
          description: 'Ordered horizontal children.',
          cardinality: 'many',
          required: true,
          templated: true,
          childProps: {
            weight: childWeightSchema
          }
        }
      },
      bindings: {},
      actions: {}
    },

    Column: {
      name: 'Column',
      category: 'layout',
      description: 'Arranges child elements vertically with semantic spacing and alignment.',
      guidance: {
        whenToUse: 'Stacking sections, form fields or a card body top to bottom.',
        whenNotToUse: 'Side-by-side peers (Row) or data-driven repeats (List).',
        examples: [
          'form fields followed by a submit Button',
          'heading, text and a Card, `gap: airy`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          gap: spacingSchema,
          justify: {
            type: 'string',
            enum: CATALOG_JUSTIFY,
            default: 'start',
            description: 'Main-axis distribution of children.'
          },
          align: {
            type: 'string',
            enum: CATALOG_ALIGNMENTS,
            default: 'stretch',
            description: 'Cross-axis alignment of children.'
          }
        }
      },
      slots: {
        children: {
          description: 'Ordered vertical children.',
          cardinality: 'many',
          required: true,
          templated: true,
          childProps: {
            weight: childWeightSchema
          }
        }
      },
      bindings: {},
      actions: {}
    },

    List: {
      name: 'List',
      category: 'layout',
      description: 'Renders a static or data-templated sequence of repeated items.',
      guidance: {
        whenToUse:
          'The same template repeated for each item in a collection, or a static run of similar items.',
        whenNotToUse: 'One-off layout (Row, Column) or records compared across fields (Table).',
        examples: ['one Card per search result', 'tags as Badge items, `direction: horizontal`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          direction: {
            type: 'string',
            enum: CATALOG_ORIENTATIONS,
            default: 'vertical',
            description: 'Primary flow direction of list items.'
          },
          gap: spacingSchema,
          align: {
            type: 'string',
            enum: CATALOG_ALIGNMENTS,
            default: 'stretch',
            description: 'Cross-axis alignment of list items.'
          }
        }
      },
      slots: {
        children: {
          description: 'Static item list or templated item prototype bound to collection data.',
          cardinality: 'many',
          required: true,
          templated: true
        }
      },
      bindings: {},
      actions: {}
    },

    Card: {
      name: 'Card',
      category: 'layout',
      description: 'Groups related content and actions inside a bounded surface container.',
      guidance: {
        whenToUse: 'Several items about one subject side by side, such as projects in a grid.',
        whenNotToUse:
          'A single section in the page flow, toned messages (Alert) or focused tasks (Modal).',
        examples: [
          'project summary with a `footer` Button',
          'plan option with `title` and `description`, in a Row'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'Optional card heading.' },
          description: { type: 'string', description: 'Optional supporting summary.' },
          padding: spacingSchema
        }
      },
      slots: {
        child: {
          description: 'Primary body content inside the card.',
          cardinality: 'single',
          required: true
        },
        footer: {
          description: 'Optional trailing actions or metadata.',
          cardinality: 'single'
        }
      },
      bindings: {},
      actions: {}
    },

    Divider: {
      name: 'Divider',
      category: 'layout',
      description: 'Separates adjacent sections visually and semantically.',
      guidance: {
        whenToUse: 'Splitting related content into groups, such as form sections.',
        whenNotToUse: 'Adding space, or separating every List item.',
        examples: [
          'between account and billing sections',
          'between action groups, `orientation: vertical`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          orientation: {
            type: 'string',
            enum: CATALOG_ORIENTATIONS,
            default: 'horizontal',
            description: 'Axis along which the divider runs.'
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    },

    Tabs: {
      name: 'Tabs',
      category: 'layout',
      description: 'Switches between peer content views in place without leaving the surface.',
      guidance: {
        whenToUse: 'Switching between peer views where exactly one is shown.',
        whenNotToUse:
          'Sections read in sequence or opened together (Accordion), picking a value (Choice) or navigation.',
        examples: ['Overview, Activity and Settings views', 'one code sample per language']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['tabs'],
        properties: {
          label: { type: 'string', description: 'Accessible label for the tab list.' },
          tabs: {
            type: 'array',
            minItems: 1,
            description: 'Ordered tab definitions paired with panel slots.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['value', 'title'],
              properties: {
                value: { type: 'string', minLength: 1, description: 'Stable tab identifier.' },
                title: { type: 'string', minLength: 1, description: 'Visible tab label.' }
              }
            }
          }
        }
      },
      slots: {
        panels: {
          description: 'Content node rendered for each tab entry.',
          cardinality: 'many',
          required: true
        }
      },
      bindings: {
        value: {
          description: 'Currently active tab value stored in local surface state.',
          valueType: 'string',
          direction: 'two-way'
        }
      },
      actions: {}
    },

    Modal: {
      name: 'Modal',
      category: 'layout',
      description: 'Presents focused secondary content in a native modal dialog.',
      guidance: {
        whenToUse:
          'A focused task or detail that interrupts the page until dismissed, opened by its `trigger`.',
        whenNotToUse:
          'Messages that stay in the page (Alert), after-the-fact confirmations (Toast) or content that fits inline.',
        examples: [
          'edit-profile form behind an Edit Button',
          'full terms behind a Read terms Button'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, description: 'Dialog heading.' },
          description: { type: 'string', description: 'Optional supporting dialog explanation.' }
        }
      },
      slots: {
        trigger: {
          description: 'Interactive trigger element that opens the dialog.',
          cardinality: 'single',
          required: true,
          allowedCategories: ['action']
        },
        content: {
          description: 'Body content rendered inside the modal dialog.',
          cardinality: 'single',
          required: true
        }
      },
      bindings: {
        open: {
          description: 'Open state of the modal dialog in local surface state.',
          valueType: 'boolean',
          direction: 'two-way'
        }
      },
      actions: {}
    },

    Button: {
      name: 'Button',
      category: 'action',
      description: 'Triggers a client-local update or emits a named outbound action.',
      guidance: {
        whenToUse: 'An action: submit, save, start, or emit a named outbound `action`.',
        whenNotToUse:
          'Navigation; Button never renders a link. Picking options (Choice) or toggling settings (Switch).',
        examples: [
          'Save changes, `variant: solid`',
          'Delete project, `variant: solid`, `tone: danger`, beside Cancel, `variant: ghost`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          label: {
            type: 'string',
            description: 'Visible button label when no child content slot is supplied.'
          },
          variant: {
            type: 'string',
            enum: CATALOG_VARIANTS,
            default: 'solid',
            description: 'Visual treatment of the button.'
          },
          tone: toneSchema('accent'),
          controlSize: controlSizeSchema,
          disabled: { type: 'boolean', default: false, description: 'Disables activation.' },
          pending: {
            type: 'boolean',
            default: false,
            description: 'Indicates an in-flight action while preserving focus.'
          }
        }
      },
      slots: {
        child: {
          description: 'Optional rich content inside the button.',
          cardinality: 'single'
        }
      },
      bindings: {},
      actions: {
        action: {
          description: 'Action dispatched when the user activates the button.',
          scope: 'outbound'
        }
      }
    },

    TextField: {
      name: 'TextField',
      category: 'input',
      description:
        'Collects single-line or multi-line text input with label, description, and validation.',
      guidance: {
        whenToUse:
          'Free text: names, email, numbers, passwords or URLs; `kind: long` for paragraphs.',
        whenNotToUse:
          'Known options (Choice), dates (DateTimeInput) or an approximate number in a range (Slider).',
        examples: [
          'email address, `kind: email`, `required: true`',
          'feedback, `kind: long`, `rows: 4`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible field label.' },
          description: { type: 'string', description: 'Optional helper text.' },
          placeholder: { type: 'string', description: 'Example value shown when empty.' },
          kind: {
            type: 'string',
            enum: ['short', 'long', 'number', 'email', 'password', 'url'],
            default: 'short',
            description: 'Input intent controlling native input type or multiline textarea.'
          },
          rows: {
            type: 'integer',
            minimum: 2,
            maximum: 20,
            description: 'Visible row count for long text.'
          },
          required: { type: 'boolean', default: false, description: 'Marks the field required.' },
          disabled: { type: 'boolean', default: false, description: 'Disables editing.' },
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Current text value bound to surface state.',
          valueType: 'string',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    Checkbox: {
      name: 'Checkbox',
      category: 'input',
      description: 'Collects an explicit boolean consent or selection state.',
      guidance: {
        whenToUse: 'An independent yes/no choice submitted later, such as consent.',
        whenNotToUse: 'Settings that apply at once (Switch) or one of several options (Choice).',
        examples: ['accept the terms, `required: true`', 'email me product updates']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible checkbox label.' },
          description: { type: 'string', description: 'Optional supporting helper text.' },
          required: { type: 'boolean', default: false, description: 'Requires checked state.' },
          disabled: { type: 'boolean', default: false, description: 'Disables toggling.' }
        }
      },
      slots: {},
      bindings: {
        checked: {
          description: 'Checked state bound to surface state.',
          valueType: 'boolean',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    Choice: {
      name: 'Choice',
      category: 'input',
      description:
        'Selects one or multiple values from curated options using an intent-based presentation.',
      guidance: {
        whenToUse:
          'Known options. `presentation`: list or segmented for a few, chips for tags, cards for rich options, dropdown for many.',
        whenNotToUse:
          'Free text (TextField), a single yes/no (Checkbox, Switch) or switching views (Tabs).',
        examples: [
          'shipping speed, `presentation: cards`',
          'country, `presentation: dropdown`, `searchable: true`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'options'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible field or group label.' },
          description: { type: 'string', description: 'Optional helper text.' },
          options: {
            type: 'array',
            minItems: 1,
            description: 'Selectable choices presented to the user.',
            items: choiceOptionSchema
          },
          selection: {
            type: 'string',
            enum: ['single', 'multiple'],
            default: 'single',
            description: 'Whether one or multiple options can be selected.'
          },
          presentation: {
            type: 'string',
            enum: CHOICE_PRESENTATIONS,
            default: 'dropdown',
            description: 'Visual presentation intent for the choice control.'
          },
          searchable: {
            type: 'boolean',
            default: false,
            description: 'Enables filtering options by typing when presented as a dropdown.'
          },
          placeholder: { type: 'string', description: 'Placeholder shown when nothing is chosen.' },
          required: { type: 'boolean', default: false, description: 'Requires a selection.' },
          disabled: { type: 'boolean', default: false, description: 'Disables selection.' },
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Selected option value or values bound to surface state.',
          valueType: 'string[]',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    Slider: {
      name: 'Slider',
      category: 'input',
      description: 'Selects a numeric value within a bounded range.',
      guidance: {
        whenToUse: 'An approximate number in a bounded range where relative position matters.',
        whenNotToUse: 'Exact values (TextField) or a few discrete options (Choice).',
        examples: ['volume, `min: 0`, `max: 100`', 'budget, `min: 500`, `max: 5000`, `step: 100`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'min', 'max'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible slider label.' },
          description: { type: 'string', description: 'Optional helper text.' },
          min: { type: 'number', description: 'Minimum allowed value.' },
          max: { type: 'number', description: 'Maximum allowed value.' },
          step: { type: 'number', exclusiveMinimum: 0, default: 1, description: 'Step increment.' },
          disabled: { type: 'boolean', default: false, description: 'Disables scrubbing.' }
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Current numeric value bound to surface state.',
          valueType: 'number',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    DateTimeInput: {
      name: 'DateTimeInput',
      category: 'input',
      description: 'Collects a calendar date, wall-clock time, or combined date and time.',
      guidance: {
        whenToUse: 'A calendar date, a time, or both, with optional ISO bounds.',
        whenNotToUse:
          'Durations or free text (TextField), or relative picks such as this week (Choice).',
        examples: ['delivery date with a `min` bound', 'meeting start, `enableTime: true`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible field label.' },
          description: { type: 'string', description: 'Optional helper text.' },
          enableDate: { type: 'boolean', default: true, description: 'Includes a date component.' },
          enableTime: {
            type: 'boolean',
            default: false,
            description: 'Includes a time component.'
          },
          min: { type: 'string', description: 'Optional ISO minimum bound.' },
          max: { type: 'string', description: 'Optional ISO maximum bound.' },
          required: { type: 'boolean', default: false, description: 'Marks the field required.' },
          disabled: { type: 'boolean', default: false, description: 'Disables editing.' },
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'ISO 8601 date or date-time string bound to surface state.',
          valueType: 'string',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    Switch: {
      name: 'Switch',
      category: 'input',
      description: 'Toggles an immediate on or off setting.',
      guidance: {
        whenToUse: 'A setting that takes effect as soon as it changes.',
        whenNotToUse: 'Choices submitted with a form, or consent (Checkbox).',
        examples: ['dark mode', 'notify me about replies']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible setting label.' },
          description: { type: 'string', description: 'Optional explanation of the setting.' },
          disabled: { type: 'boolean', default: false, description: 'Disables toggling.' },
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {
        checked: {
          description: 'Current on/off state bound to surface state.',
          valueType: 'boolean',
          direction: 'two-way',
          validatable: true
        }
      },
      actions: {}
    },

    Alert: {
      name: 'Alert',
      category: 'feedback',
      description: 'Displays inline status or contextual feedback with optional live announcement.',
      guidance: {
        whenToUse: 'A message that must stay in the page, with optional follow-up `actions`.',
        whenNotToUse: 'Confirming what the user just did (Toast) or an error tied to one field.',
        examples: [
          'Connection interrupted, `tone: warning`',
          'Payment failed, `tone: danger`, `announce: assertive`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, description: 'Primary alert heading.' },
          description: { type: 'string', description: 'Optional supporting detail.' },
          tone: toneSchema('neutral'),
          announce: {
            type: 'string',
            enum: CATALOG_ANNOUNCEMENTS,
            default: 'off',
            description: 'Live-region urgency independent of visual tone.'
          }
        }
      },
      slots: {
        actions: {
          description: 'Optional follow-up actions inside the alert.',
          cardinality: 'many',
          allowedCategories: ['action']
        }
      },
      bindings: {},
      actions: {}
    },

    Badge: {
      name: 'Badge',
      category: 'feedback',
      description: 'Shows compact passive status or category text.',
      guidance: {
        whenToUse: 'Short passive text labeling a status, count or category.',
        whenNotToUse: 'Anything clickable (Button) or updates that must be announced (Alert).',
        examples: ['Needs review, `tone: warning`', '3 new, `tone: accent`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, description: 'Short badge label.' },
          tone: toneSchema('neutral'),
          decorative: {
            type: 'boolean',
            default: false,
            description: 'Hides redundant badges when adjacent text already states the value.'
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    },

    Progress: {
      name: 'Progress',
      category: 'feedback',
      description: 'Shows determinate or indeterminate task completion progress.',
      guidance: {
        whenToUse: 'A task advancing toward completion; `value: null` when the amount is unknown.',
        whenNotToUse: 'Measured levels such as storage, or a static percentage in text.',
        examples: ['upload, `value: 40`, `max: 100`', 'preparing export, `value: null`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible or accessible task label.' },
          value: {
            type: ['number', 'null'],
            minimum: 0,
            description: 'Completed amount, or null when progress is indeterminate.'
          },
          max: {
            type: 'number',
            exclusiveMinimum: 0,
            default: 100,
            description: 'Total completion target.'
          }
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Optional reactive progress value from surface state.',
          valueType: 'number',
          direction: 'read'
        }
      },
      actions: {}
    },

    Accordion: {
      name: 'Accordion',
      category: 'data',
      description: 'Organizes collapsible sections that disclose details on demand.',
      guidance: {
        whenToUse: 'Sections opened on demand, such as FAQs or details read in sequence.',
        whenNotToUse: 'Switching views where one is always shown (Tabs) or a single short note.',
        examples: ['FAQ with one section open at a time', 'order details, `selection: multiple`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['items'],
        properties: {
          selection: {
            type: 'string',
            enum: ['single', 'multiple'],
            default: 'single',
            description: 'Whether one or multiple sections may stay open simultaneously.'
          },
          items: {
            type: 'array',
            minItems: 1,
            description: 'Ordered collapsible section headers.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['value', 'title'],
              properties: {
                value: { type: 'string', minLength: 1, description: 'Stable section identifier.' },
                title: { type: 'string', minLength: 1, description: 'Section trigger heading.' },
                disabled: {
                  type: 'boolean',
                  default: false,
                  description: 'Prevents expanding or collapsing this section.'
                }
              }
            }
          }
        }
      },
      slots: {
        panels: {
          description: 'Content node rendered for each accordion section.',
          cardinality: 'many',
          required: true
        }
      },
      bindings: {
        value: {
          description: 'Open section value or values stored in local surface state.',
          valueType: 'string[]',
          direction: 'two-way'
        }
      },
      actions: {}
    },

    Table: {
      name: 'Table',
      category: 'data',
      description: 'Displays structured tabular data with typed columns and templated rows.',
      guidance: {
        whenToUse: 'Records compared across the same fields, with a `caption`.',
        whenNotToUse: 'Layout, or items without shared fields (List).',
        examples: [
          'invoices with number, date and amount, `align: end` on amount',
          'team members with role and status'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['caption', 'columns'],
        properties: {
          caption: { type: 'string', minLength: 1, description: 'Accessible table caption.' },
          density: spacingSchema,
          columns: {
            type: 'array',
            minItems: 1,
            description: 'Ordered table column headers.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['field', 'label'],
              properties: {
                field: { type: 'string', minLength: 1, description: 'Row data field name.' },
                label: { type: 'string', minLength: 1, description: 'Column header label.' },
                align: {
                  type: 'string',
                  enum: ['start', 'center', 'end'],
                  default: 'start',
                  description: 'Logical horizontal alignment for column cells.'
                }
              }
            }
          }
        }
      },
      slots: {
        rows: {
          description: 'Row template or explicit row entries rendered per data record.',
          cardinality: 'many',
          required: true,
          templated: true
        }
      },
      bindings: {
        data: {
          description: 'Collection of row records bound from surface state.',
          valueType: 'object[]',
          direction: 'read'
        }
      },
      actions: {}
    },

    AnnotatedText: {
      name: 'AnnotatedText',
      category: 'data',
      description:
        'Text split into tokens with colored spans, labels under tokens, and arcs between tokens.',
      guidance: {
        whenToUse:
          'Tags or relations on a short text, such as entities, roles or review notes; one `series` per concept. Keep to one or two lines of tokens.',
        whenNotToUse: 'Running prose (Text) or records with shared fields (Table).',
        examples: [
          'code line with nested statement and call `spans` and an arc from argument to call',
          'sentence with entity spans and a `labels` row under each token'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'tokens'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Accessible name of the text.' },
          tokens: {
            type: 'array',
            minItems: 1,
            description:
              'Tokens in reading order; spans and arcs refer to them by zero-based index.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text'],
              properties: {
                text: { type: 'string', minLength: 1, description: 'Token text.' },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels stacked under the token, in order.'
                }
              }
            }
          },
          spans: {
            type: 'array',
            description: 'Tagged runs of tokens; they may overlap and nest.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['start', 'end', 'label', 'series'],
              properties: {
                start: { type: 'integer', minimum: 0, description: 'First token index.' },
                end: {
                  type: 'integer',
                  minimum: 0,
                  description: 'Last token index, at or after `start`.'
                },
                label: { type: 'string', minLength: 1, description: 'Span tag.' },
                series: seriesSchema
              }
            }
          },
          arcs: {
            type: 'array',
            description: 'Links from one token to another.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['from', 'to'],
              properties: {
                from: { type: 'integer', minimum: 0, description: 'Source token index.' },
                to: { type: 'integer', minimum: 0, description: 'Target token index, not `from`.' },
                label: { type: 'string', description: 'Optional relation name.' },
                series: seriesSchema
              }
            }
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    },

    Matrix: {
      name: 'Matrix',
      category: 'data',
      description:
        'A grid of cells under column and row headers, with cell states, series colors, markers and labelled regions.',
      guidance: {
        whenToUse:
          'Values placed by two axes, such as a heatmap, seat map or weekly schedule; with `selection`, a cell `value` makes it selectable.',
        whenNotToUse: 'Records with named fields (Table) or a few options (Choice).',
        examples: [
          'seat map, `selection: multiple`, taken seats `disabled`',
          'busy hours by weekday with `series` colors and a labelled region'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'columns', 'rows'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Accessible name of the grid.' },
          selection: {
            type: 'string',
            enum: ['none', 'single', 'multiple'],
            default: 'none',
            description: 'Whether cells with a value can be selected, one or many.'
          },
          columns: {
            type: 'array',
            minItems: 1,
            description: 'Column headers in order.',
            items: matrixHeaderSchema('Column header text.')
          },
          rows: {
            type: 'array',
            minItems: 1,
            description: 'Rows in order, each with one cell per column.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['label', 'cells'],
              properties: {
                label: { type: 'string', minLength: 1, description: 'Row header text.' },
                cells: {
                  type: 'array',
                  description: 'Cells in column order; missing cells are empty.',
                  items: matrixCellSchema
                }
              }
            }
          },
          regions: {
            type: 'array',
            description: 'Labelled blocks of cells, counted from the first cell row and column.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['row', 'column', 'label'],
              properties: {
                row: { type: 'integer', minimum: 1, description: 'First cell row, from 1.' },
                column: { type: 'integer', minimum: 1, description: 'First cell column, from 1.' },
                rowSpan: { type: 'integer', minimum: 1, default: 1, description: 'Rows spanned.' },
                columnSpan: {
                  type: 'integer',
                  minimum: 1,
                  default: 1,
                  description: 'Columns spanned.'
                },
                label: { type: 'string', minLength: 1, description: 'Visible region label.' },
                series: matrixSeriesSchema
              }
            }
          }
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Values of the selected cells.',
          valueType: 'string[]',
          direction: 'two-way'
        }
      },
      actions: {}
    },

    RegionStage: {
      name: 'RegionStage',
      category: 'data',
      description:
        'A drawing that pans and zooms, with named regions to select and pins with callouts.',
      guidance: {
        whenToUse:
          'Choosing or pointing at areas of a plan or diagram drawn as SVG `regions` in one `viewBox`; `pins` mark points with a short callout.',
        whenNotToUse: 'Options without a spatial layout (Choice) or plotted data (charts).',
        examples: [
          'office floor plan, rooms as `regions`, `selection: multiple`',
          'machine diagram with `pins` at parts that need service'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'viewBox', 'regions'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Accessible name of the drawing.' },
          viewBox: {
            type: 'string',
            minLength: 1,
            description: 'SVG viewBox, `minX minY width height`, that regions and pins use.'
          },
          regions: {
            type: 'array',
            minItems: 1,
            description: 'Selectable areas in reading order, which is also keyboard order.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['value', 'label', 'path'],
              properties: {
                value: { type: 'string', minLength: 1, description: 'Stable region value.' },
                label: { type: 'string', minLength: 1, description: 'Region name.' },
                path: {
                  type: 'string',
                  minLength: 1,
                  description: 'SVG path data in viewBox units.'
                },
                series: seriesSchema
              }
            }
          },
          pins: {
            type: 'array',
            description: 'Points with a callout; they follow the regions in keyboard order.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['x', 'y', 'label'],
              properties: {
                x: { type: 'number', description: 'Horizontal position in viewBox units.' },
                y: { type: 'number', description: 'Vertical position in viewBox units.' },
                label: { type: 'string', minLength: 1, description: 'Pin name.' },
                text: { type: 'string', description: 'Callout text.' }
              }
            }
          },
          selection: {
            type: 'string',
            enum: ['single', 'multiple'],
            default: 'single',
            description: 'Whether one or several regions can be selected.'
          }
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Selected region values bound to surface state.',
          valueType: 'string[]',
          direction: 'two-way'
        }
      },
      actions: {}
    },

    RelationGraph: {
      name: 'RelationGraph',
      category: 'data',
      description:
        'Nodes and directed, labelled edges, laid out as a tree, in layers or on a circle.',
      guidance: {
        whenToUse:
          'Relations between named things, such as an org chart, dependencies or a cycle of states. A layered `layout` suits nodes with several parents. Keep labels short.',
        whenNotToUse: 'Steps without branches (Stepper) or nested items to expand (Tree).',
        examples: [
          'org chart in a tree `layout` with one node `emphasis` highlighted',
          'state machine on a circle with labelled `edges` and a loop'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'layout', 'nodes'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Accessible name of the graph.' },
          layout: {
            type: 'string',
            enum: ['tree', 'layered', 'circular'],
            description:
              '`tree` puts each node under its first parent, `layered` follows edge direction, `circular` keeps node order.'
          },
          nodes: {
            type: 'array',
            minItems: 1,
            description: 'Nodes in order; edges refer to them by `id`.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'label'],
              properties: {
                id: { type: 'string', minLength: 1, description: 'Unique node id.' },
                label: { type: 'string', minLength: 1, description: 'Node text.' },
                series: seriesSchema,
                emphasis: {
                  type: 'string',
                  enum: ['highlighted', 'muted'],
                  description: 'Draws the node stronger or fainter; say why in `description`.'
                },
                description: {
                  type: 'string',
                  description: 'Text announced after the connections, such as a state.'
                }
              }
            }
          },
          edges: {
            type: 'array',
            description: 'Directed edges; cycles and loops are allowed.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['from', 'to'],
              properties: {
                from: { type: 'string', minLength: 1, description: 'Source node id.' },
                to: { type: 'string', minLength: 1, description: 'Target node id.' },
                label: { type: 'string', description: 'Optional relation name.' },
                series: seriesSchema,
                emphasis: {
                  type: 'string',
                  enum: ['highlighted', 'muted'],
                  description: 'Draws the edge stronger or fainter; say why in `description`.'
                },
                description: {
                  type: 'string',
                  description: 'Text both nodes announce after this connection.'
                }
              }
            }
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {}
    },

    Toast: {
      name: 'Toast',
      category: 'feedback',
      invocation: 'action',
      description:
        'Displays a transient notification triggered by an action rather than static layout.',
      guidance: {
        whenToUse:
          'Confirming or reporting an action the user just took. Dispatch it from an action, not layout.',
        whenNotToUse: 'Messages that must stay (Alert) or decisions before continuing (Modal).',
        examples: ['Draft saved', 'Message deleted, `actionLabel: Undo`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, description: 'Primary notification heading.' },
          description: { type: 'string', description: 'Optional supporting detail.' },
          tone: toneSchema('neutral'),
          announce: {
            type: 'string',
            enum: CATALOG_ANNOUNCEMENTS,
            default: 'polite',
            description: 'Live-region urgency for screen readers.'
          },
          duration: {
            type: 'integer',
            minimum: 1000,
            maximum: 30000,
            description: 'Auto-dismiss timeout in milliseconds.'
          },
          actionLabel: {
            type: 'string',
            description: 'Optional label for a single follow-up button inside the toast.'
          }
        }
      },
      slots: {},
      bindings: {},
      actions: {
        action: {
          description: 'Optional outbound action triggered by the toast follow-up button.',
          scope: 'outbound'
        }
      }
    },

    Stage: {
      name: 'Stage',
      category: 'layout',
      description:
        'Frames one interactive widget with a titled header, actions, a body and a footer.',
      guidance: {
        whenToUse:
          'Placing an app widget, such as a map or editor, in its `child` with a `title`; set `aspectRatio` when its size is known.',
        whenNotToUse: 'Grouping static content (Card) or focused tasks (Modal).',
        examples: [
          'map with a zoom Button in `actions`, `aspectRatio: 1.5`',
          'drawing canvas with Undo and Clear in `footer`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, description: 'Widget heading.' },
          description: { type: 'string', description: 'Optional supporting summary.' },
          aspectRatio: {
            type: 'number',
            exclusiveMinimum: 0,
            description: 'Body width divided by height, held while the body content streams in.'
          },
          padding: spacingSchema
        }
      },
      slots: {
        actions: {
          description: 'Optional controls beside the title.',
          cardinality: 'many'
        },
        child: {
          description: 'The widget rendered in the body.',
          cardinality: 'single',
          required: true
        },
        footer: {
          description: 'Optional content after the body.',
          cardinality: 'many'
        }
      },
      bindings: {},
      actions: {}
    },

    Split: {
      name: 'Split',
      category: 'layout',
      description:
        'Places a main area beside a secondary area, stacking them when space is narrow.',
      guidance: {
        whenToUse:
          'Main content with supporting content; set `side` and `ratio` instead of widths.',
        whenNotToUse: 'Equal peers (Grid) or options weighed against each other (Compare).',
        examples: [
          'article with a summary Card, `side: end`',
          'filters beside results, `side: start`, `ratio: main`'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          side: {
            type: 'string',
            enum: ['start', 'end'],
            default: 'end',
            description: 'Side of the secondary area; at start it also comes first when stacked.'
          },
          ratio: {
            type: 'string',
            enum: ['balanced', 'main'],
            default: 'main',
            description: 'Equal widths, or two thirds for the main area.'
          },
          gap: spacingSchema
        }
      },
      slots: {
        main: { description: 'Primary content.', cardinality: 'single', required: true },
        secondary: {
          description: 'Supporting content, such as filters or a summary.',
          cardinality: 'single',
          required: true
        }
      },
      bindings: {},
      actions: {}
    },

    Grid: {
      name: 'Grid',
      category: 'layout',
      description: 'Lays out equal items in as many columns as fit, up to a maximum.',
      guidance: {
        whenToUse:
          'Equal items such as cards or tiles; set `maxColumns` and Radiant fits the columns to the width.',
        whenNotToUse: 'Areas of different weight (Split) or one line of peers (Row).',
        examples: ['course cards, `maxColumns: 3`', 'photo tiles, `maxColumns: 4`, `gap: tight`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          maxColumns: {
            type: 'integer',
            minimum: 1,
            maximum: 6,
            default: 3,
            description: 'Most columns shown; fewer appear when space is narrow.'
          },
          gap: spacingSchema
        }
      },
      slots: {
        children: {
          description: 'Ordered equal items.',
          cardinality: 'many',
          required: true,
          templated: true
        }
      },
      bindings: {},
      actions: {}
    },

    Compare: {
      name: 'Compare',
      category: 'layout',
      description:
        'Shows two to four options side by side with aligned rows, stacking when narrow.',
      guidance: {
        whenToUse: 'Two to four options weighed side by side; each of `children` is a CompareItem.',
        whenNotToUse: 'Records with shared fields (Table) or equal items (Grid).',
        examples: [
          'three plans with prices and a Choose Button each',
          'two laptops with specs in each body'
        ]
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { gap: spacingSchema }
      },
      slots: {
        children: {
          description: 'Two to four CompareItem options.',
          cardinality: 'many',
          required: true,
          allowedEntries: ['CompareItem']
        }
      },
      bindings: {},
      actions: {}
    },

    CompareItem: {
      name: 'CompareItem',
      category: 'layout',
      description: 'One option in a Compare, with rows that line up with the other options.',
      guidance: {
        whenToUse:
          'Each option in a Compare: `header` names it, `body` describes it, `footer` holds its action.',
        whenNotToUse: 'Content outside a Compare (Card).',
        examples: [
          'plan name and price in `header`, a Button in `footer`',
          'method name in `header`, trade-offs in `body`'
        ]
      },
      propsSchema: { type: 'object', additionalProperties: false, properties: {} },
      slots: {
        header: { description: 'Names the option.', cardinality: 'single', required: true },
        body: { description: 'Describes the option.', cardinality: 'single' },
        footer: { description: 'Optional action or note.', cardinality: 'single' }
      },
      bindings: {},
      actions: {}
    },

    Reveal: {
      name: 'Reveal',
      category: 'layout',
      description:
        'Shows content one step at a time with previous and next controls labelled by the host.',
      guidance: {
        whenToUse: 'Content read one part at a time, such as recipe or setup `steps`.',
        whenNotToUse:
          'Content needed at once (Column) or sections opened in any order (Accordion).',
        examples: ['four recipe steps', 'setup instructions in three parts, `gap: airy`']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { gap: spacingSchema }
      },
      slots: {
        steps: {
          description: 'Ordered steps, one shown at a time.',
          cardinality: 'many',
          required: true
        }
      },
      bindings: {},
      actions: {}
    },

    SortableList: {
      name: 'SortableList',
      category: 'input',
      description:
        'An ordered list the user reorders by dragging or with the keyboard; the order is the value.',
      guidance: {
        whenToUse: 'The user ranks or sequences a few known `items`, such as priorities.',
        whenNotToUse: 'Choosing some items (Choice) or a fixed order the user only reads (List).',
        examples: ['rank three trip priorities', 'playlist order bound to a data path']
      },
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'items'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible list label.' },
          description: { type: 'string', description: 'Optional helper text.' },
          items: {
            type: 'array',
            minItems: 1,
            description: 'Items in their starting order; the bound value reorders them.',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['value', 'label'],
              properties: {
                value: { type: 'string', minLength: 1, description: 'Stable item value.' },
                label: { type: 'string', minLength: 1, description: 'Visible item text.' }
              }
            }
          },
          disabled: { type: 'boolean', default: false, description: 'Prevents reordering.' },
          controlSize: controlSizeSchema
        }
      },
      slots: {},
      bindings: {
        value: {
          description: 'Item values in their current order, bound to surface state.',
          valueType: 'string[]',
          direction: 'two-way'
        }
      },
      actions: {}
    }
  }
})
