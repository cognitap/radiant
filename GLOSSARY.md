# Radiant

Radiant is a reusable interaction and presentation system. These terms describe
the design language shared by its families and consumers.

## Language

**Family**:
A set of related Radiant elements that fulfil one interaction or presentation
responsibility, such as Dialog and its trigger, content, title and close parts.

**Part**:
A meaningful named element within a family, with a defined semantic and visual
responsibility. A part may also fulfil a responsibility inherited from another family.

**Root**:
The element or logical parent that owns a family's shared relationships and
state. A root does not necessarily introduce a visible element.

**Design token**:
A named design decision with a role shared across the system, such as control
shape, body typography or focus appearance.
_Avoid_: Button setting, magic value

**Component override**:
A deliberate exception to shared design decisions for a particular family or
part. An override has a local purpose rather than defining the whole system.

**Theme**:
A named, coherent set of design decisions and intentional component overrides.
_Avoid_: Button theme, collection of examples

**Theme scope**:
A region that shares a theme and appearance preference. A nested scope can
inherit its surroundings or deliberately establish its own theme.

**Mode**:
The light or dark appearance of a theme; system preference chooses between them.
Mode is independent of a theme's identity.

**Variant**:
The visual treatment of an action, such as solid, soft, outline or ghost.
_Avoid_: Tone, intent

**Tone**:
The semantic color role of an action: accent, neutral, warning or danger.
_Avoid_: Outline tone, ghost tone

**Control size**:
A named visual size for controls, independent of their native data or behavior.
_Avoid_: Native size

**State owner**:
The single authority for an element's current value, selection or open state.
The authority may be the consumer or the element itself.

**Change request**:
A request to change semantic state, which its state owner may accept or decline.
Synchronising an already-owned value is not another request.

**Functional CSS**:
Styling required for behavior, layout relationships or accessible visibility to
work correctly. Replacing visual appearance preserves these requirements.
