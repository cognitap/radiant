import { createElement } from 'react'
import { hydrateRoot } from 'react-dom/client'
import '@cognitap/radiant/styles.css'
import { App } from './App.mjs'

hydrateRoot(document.getElementById('root'), createElement(App), {
  onRecoverableError: error => console.error(error)
})
