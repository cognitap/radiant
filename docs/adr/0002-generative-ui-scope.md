---
status: accepted
---

# Scope of Radiant's generative UI support

Radiant provides the component kit, model-facing catalog, and runtime primitives that language models compose into interfaces. Applications supply domain logic, prompts, and custom extensions.

## Boundary

Radiant ships generic, domain-agnostic primitives only. A component belongs in Radiant only if unrelated applications across different domains can use it as is. Product-specific workflows, domain rules, scoring, and custom widgets stay in consuming applications as catalog extensions.

**Rejected:** Shipping vertical or product-specific widgets in Radiant. Coupling a general-purpose component library to any single application's domain model narrows reuse and bloats the catalog for every other consumer.

## Protocol

Radiant defines one canonical catalog independent of any wire format. Protocol adapters translate from that catalog; A2UI 1.0 is the first adapter.

**Rejected:** Authoring schemas and guidance directly inside A2UI or another single protocol. Tying the catalog definition to one wire format locks component contracts to a transport and forces a full rewrite if the adapter changes.
