---
status: accepted
---

# Render A2UI 1.0 directly on `@a2ui/web_core`

Radiant builds its A2UI 1.0 React renderer directly on `@a2ui/web_core`'s headless engine rather than using `@a2ui/react`.

Rendering directly keeps Radiant's host contract and direct-child DOM structure intact with no wrapper elements, works under server-side rendering without browser globals, and ingests Radiant's JSON Schema catalog directly without maintaining duplicate schemas. Streamed patches update existing nodes in place so focus and typed input survive updates, and local state mutations stay on the client without triggering outbound agent actions.

**Rejected:** `@a2ui/react`, which does not support A2UI 1.0, wraps every component in custom elements that break direct-child layout and styling contracts, mutates catalogs globally, and fails under server-side rendering.
