# DEV-174: native spring transitions

The focused TransitionMotion Chromium proof verifies actual details height and
momentum on rapid reversal, ResizeObserver content updates, closed inert/ARIA
state, immediate reduced/off behavior, Accordion keyboard/state composition,
Dialog top-layer/focus/cancel semantics, inert presentation-only exit, same-frame
reopen continuity and disposal. Source lint/types and the existing native
Dialog/disclosure unit suites cover preserved composition/ref behavior.

Dialog exits close the real native host immediately; the optional visual copy is
a plain div, not another native dialog. It is hidden from AT, inert, pointer-free,
without IDs/names/autofocus, and has disabled form controls. Copying is skipped for
nested dialogs and content with custom elements, scripts/styles, embeds or media.
This is an explicit bounded exit policy, not a claim of retained top-layer exit.

The [runtime contract](../motion.md#disclosure-and-dialog-transitions) describes
measurement, styling ownership, progressive fallback and snapshot limits.
System/Motion → Transitions is the canonical composed example. Final stack gates
are recorded with DEV-175. Automated Chromium/server evidence does not constitute
manual assistive-technology or cross-browser certification.
