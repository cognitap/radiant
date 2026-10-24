import type { Preview } from '@storybook/react-vite'
import { ThemedDocsContainer, withTheme } from './ThemePreview.js'
import { themes } from '../src/index.js'
import './styles.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme preset',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        dynamicTitle: true,
        items: themes.map(theme => ({ value: theme.id, title: theme.name }))
      }
    },
    mode: {
      description: 'Color mode',
      toolbar: {
        title: 'Mode',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ]
      }
    }
  },
  initialGlobals: { theme: 'radiant', mode: 'system' },
  decorators: [withTheme],
  parameters: {
    a11y: { test: 'error' },
    docs: { container: ThemedDocsContainer },
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  tags: ['autodocs']
}

export default preview
