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
            enum: ['contain', 'cover', 'fill', 'scale-down'],
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
      description: 'Plays an audio track with native browser controls.',
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
            description: 'Visible row count when kind is "long".'
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
      propsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['label'],
        properties: {
          label: { type: 'string', minLength: 1, description: 'Visible setting label.' },
          description: { type: 'string', description: 'Optional explanation of the setting.' },
          disabled: { type: 'boolean', default: false, description: 'Disables toggling.' }
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

    Toast: {
      name: 'Toast',
      category: 'feedback',
      invocation: 'action',
      description:
        'Displays a transient notification triggered by an action rather than static layout.',
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
    }
  }
})
