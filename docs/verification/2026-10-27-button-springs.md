# DEV-173: native action springs

MotionProvider opts real Button hosts and composed Dialog actions into the
accepted runtime. MotionLink adapts action-shaped anchors while ordinary Link
retains its static/server boundary. Root imports do not import Motion physics.

The browser proof (`tests/browser/ButtonMotion.test.tsx`) checks visible continued
travel on re-press during rebound, absence of competing CSS scale transitions,
caller transform, cancellation/outside release, native form submitter data,
Enter/Space/repeat, disabled fieldsets/pending, caller prevention, ref/render
composition, live reduced motion, local off, owned scale/class overrides, native
Dialog focus and hydration. A Chromium CDP touch case verifies real touch submit
and touch cancellation without synthesizing click. The native Dialog/form suite
continues to verify existing resolved-prop/ref semantics.

The adapter owns individual scale only. Caller inline scale and recognized scale
utilities retain ownership; arbitrary external scale rules need explicit opt-out.
Live preference/disabled changes cancel to neutral; no native activation is
created, postponed or repeated. The public usage example and limits are in
[the motion guide](../motion.md#native-action-springs); the canonical live example
is System/Motion → ButtonPress. The website editor remains DEV-178.

Run source generation/format/lint/types, the native Dialog/form tests and the
focused ButtonMotion browser file. Full stack gates are recorded with DEV-175.
Evidence is automated Chromium/server behavior, not manual assistive-technology
or cross-browser certification.
