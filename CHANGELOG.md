# Changelog

[Release policy](RELEASE_POLICY.md)

## Unreleased

- Add `seriesPalette(palette)` to `@cognitap/radiant/color` and the root: light and dark `tokens.series` solids for a `recommendColorPalette` result, the default series moved by one shared lightness step where the palette's surface, canvas, or foreground needs it, so generated themes keep the series contrast and color-vision guarantees.
- Breaking: `chartPalette(palette)` is deprecated and its colors change. Before, it returned `series1` to `series6` from the `primary`, `support`, `success`, `warning`, and `danger` fills and the `neutral` foreground, so success sat next to danger; now it returns `series1` to `series8` equal to `seriesPalette(palette)`. Migrate by setting `seriesPalette(palette).light` and `.dark` as `tokens.series` in each mode instead of `components.chart`.

## 0.0.95

- Add `Stage`, a frame for custom widgets with `StageHeader`, `StageTitle`, `StageDescription`, `StageActions`, `StageBody`, and `StageFooter`. Stage is an inline-size container: its header and footer lay out by its own width, and it takes 20rem in a box that sizes to its content. `StageBody` `aspectRatio` holds the body size while content streams in, clips taller content, and leaves room for a body-filling control's focus ring. Themes style it through `components.stage`. The canonical catalog and A2UI extension catalog add `Stage` (`title`, `description`, `aspectRatio`, `padding`, `actions`, `child`, `footer`); the A2UI Stage is a group named by its title, and `validateA2uiAccessibility` flags a Stage without a title.
- Add `anchor` to `Popover`, `Tooltip`, and `HoverCard`: position against an HTML or SVG element, a viewport `{ x, y, width, height }` rect, or a rect getter instead of the trigger, with flipping, theme, and direction kept. Popups reposition on rect changes, scroll, resize, and SVG transform or `viewBox` changes; flipped rects are normalized, and non-finite ones keep the last position. Rect-anchored popups portal to the nearest HTML ancestor, even inside SVG. `useTooltip()` returns `anchorProps` for trigger-less anchors (new `TooltipAnchorProps` type). `PopoverContent` and `HoverCardContent` take `returnFocusRef`; without it, focus returns to the trigger, a focusable anchor, or the previously focused element. New types: `PopoverAnchor` and `PopoverAnchorRect`.
- Add the public series tokens `--rad-series-1-` to `--rad-series-8-` `solid`, `soft`, `border`, and `text` (`tokens.series`, with `SeriesIndex` and `SeriesTokens` types), which every theme and mode sets: eight distinct hues that stay apart under simulated color-vision deficiencies. Charts accept up to eight series.
- Breaking: chart colors change. Before, series 1 to 6 mixed `accent`, `focus`, `warning`, and `danger` with `foreground`, then used `foreground` and `muted-foreground`; now series N reads `--rad-series-N-solid` (blue, orange, emerald, pink, sky, amber, violet, red by default). `components.chart.series1` to `series8` still override them. A `PieChart` with more than six slices colors slices 7 and 8 with series 7 and 8 instead of repeating series 1 and 2.
- The A2UI extension catalog adds `Alert`, `Badge`, `Progress`, `Accordion`, `Table`, and `Toast` with their `tone`, `announce` and `density` vocabulary; invalid values coerce with diagnostics. `Accordion` items each name their `panel`. `Table` takes agent-defined `columns` and renders each of `rows`, usually a template over a data path keyed by item index, as a `Row` with one cell per column. `Toast` shows while the data path bound to `open` is true, so the host raises it by setting that path in reply to an action (writing false first to show it again); dismissal writes false, and it closes after 5 seconds unless `duration` is set. Toasts use an enclosing host `ToastProvider` and its viewport, else the surface's own viewport, named by the new `A2uiSurface` `labels.notifications` (without either, toasts render nothing and report a fallback diagnostic); `labels.toastClose` adds a close button. `validateA2uiAccessibility` flags missing alert, badge, toast and progress text, an unbound toast `open`, a missing table caption, rows that do not match the columns, and untitled or repeated accordion items.

## 0.0.94

- Add `A2UI_BASIC_CATALOG_REVISION` to `@cognitap/radiant/a2ui`, pinning the `@a2ui/web_core` release and specification basic catalog that Radiant's A2UI rendering was tested against and naming that release in the `catalog.json` description; the official basic `catalogId` is unchanged.
- Render the A2UI `Row`, `Column`, `List`, `Card`, `Divider`, `Tabs`, and `Modal` with Radiant `Stack`, `Card`, `Separator`, `Tabs`, and `Dialog`: `Row` and `Column` translate `justify` and `align` (unknown values fall back to the defaults) and box each child, growing it by `weight`; a templated `List` renders one item per data entry with paths relative to it; `Tabs` follow their panel components when reordered; and `Modal` opens a native dialog from its Button `trigger`, named by the trigger text. Escape and backdrop clicks close a `Modal`; the new `A2uiSurface` `labels.modalClose` adds a close button with host-supplied text. `validateA2uiAccessibility` flags untitled tabs and a `Modal` without a Button trigger or trigger text. Row and List hosts carry `data-slot` `stack a2ui-row` and `stack a2ui-list`.
- Breaking: the A2UI `Column` gap reads `--rad-spacing-normal` instead of `--rad-surface-gap` (both 1rem by default), and its `data-slot` changes from `a2ui-column` to `stack a2ui-column`, so exact `[data-slot="a2ui-column"]` selectors no longer match; use `[data-slot~="a2ui-column"]`.
- Add the A2UI extension catalog: `radiantA2uiExtensionRegistry` renders `Select` and `Combobox` (options from `items`, a literal list or a data binding), `RadioGroup`, `Switch`, and `Textarea` with `controlSize`, two-way binding and `checks`, alongside every basic component, and publishes `extension-catalog.json`. `Combobox` writes a bound `query`, sends a debounced `search` action and shows `loading`, so the host fetches results. `A2uiSurface` and `validateA2uiAccessibility` default to it and accept both catalog IDs; components outside their catalog degrade to text. `createA2uiRegistry` takes `extends`. The catalog `Switch` entry gains `controlSize`.
- A2UI `Button` stays disabled while its `checks` fail.
- Add `PUBLIC_THEME_TOKENS`, the `PublicThemeToken` type and `themeTokenVar` for components built outside Radiant, and `createA2uiExtensionEntry`, which turns an `extendCatalog` entry into an A2UI registry entry with its generated schema and guidance, `createA2uiExtensionRegistry`, which extends `radiantA2uiExtensionRegistry` with those entries under a host `catalogId` and adds the instructions their props need, plus `readA2uiValue`, `writeA2uiBinding`, `runA2uiAction` and `isA2uiChildNode` so app adapters use the surface state and actions without importing `@a2ui/web_core`; duplicate registry names now say they cannot shadow another entry.

## 0.0.93

- Add `Stack`, a one-dimensional flex layout with `orientation`, `gap` from the theme spacing scale, `align`, `justify`, and `wrap`.
- Breaking: catalog entries, including `extendCatalog` entries, require `guidance` (`{ whenToUse, whenNotToUse, examples: [string, string] }`) within `CATALOG_GUIDANCE_TOKEN_BUDGET`, with props written as `` `prop: value` `` spans the entry accepts; before, `guidance` was optional with optional examples. `@cognitap/radiant/catalog` adds `renderCatalogGuidance`, `renderCatalogInstructions`, `describeCatalogEntry` and `estimateCatalogTokens`. Generated A2UI catalogs carry wire-correct guidance in each description and per-catalog `instructions`.
- Render A2UI `Icon`, `Image`, `Video`, and `AudioPlayer` with native elements and controls, map icon names and check media URLs through `A2uiMediaProvider` (`icons`, `urlPolicy`; `lucideA2uiIcons` from `@cognitap/radiant/a2ui/lucide` for the optional `lucide-react` peer), add the `imageAltRule` and `mediaNameRule` accessibility rules, and pass an optional `reportDiagnostic` to registry adapters.
- Render the A2UI `DateTimeInput` as a native `date`, `time`, or `datetime-local` Radiant `Input` bound to the data model, with failed `checks` shown as its `Field` error; zoned values show in local time and save in UTC.
- Run the A2UI basic-catalog functions (`required`, `email`, `regex`, `length`, `numeric`, `and`, `or`, `not`, and formatting) in `checks` and bindings, formatting in the `LocaleProvider` locale, and list them in `catalog.json`; `openUrl` is omitted so navigation stays with the host.

## 0.0.92

- Add `@cognitap/radiant/catalog` defining Radiant's canonical, protocol-independent model-facing catalog with schema validation, forbidden-prop guardrails, and `extendCatalog`.
- Add `@cognitap/radiant/a2ui` with `A2uiSurface`, the A2UI 1.0 component registry, and generated `catalog.json` for rendering A2UI surfaces with Radiant components.
- Coerce invalid, missing, forbidden, and mixed controlled/uncontrolled props at the A2UI boundary, isolate failing nodes inside per-node text-fallback error boundaries, and report structured diagnostics via `onDiagnostic` and `summarizeCatalogDiagnostics`.
- Add the protocol-independent `CatalogActionEvent` contract (`{ action, surfaceId, nodeId, state }`) in `@cognitap/radiant/catalog`, bind `CheckBox`, `ChoicePicker`, and `Slider` to client-local surface state in `@cognitap/radiant/a2ui`, and deliver immutable state snapshots on named outbound actions.
- Add the themeable `tight | normal | airy` spacing scale (`--rad-spacing-tight`, `-normal`, `-airy`), `Card` `padding` and `Table` `density` steps with per-step component overrides, and the `Spacing` type.
- Stream A2UI surfaces progressively: components arrive in any order as `aria-hidden` Skeleton placeholders under an `aria-busy` surface, updates before `createSurface` are buffered, and unknown components and catalog or protocol errors reach `onDiagnostic` as `kind: 'error'` diagnostics with a `code` (counted in `summarizeCatalogDiagnostics().errors`).
- Merge incremental A2UI surface patches by stable node ID against detached wire history to preserve local state, focus, scroll position, and drags, animate newly added rendered instances once, and restore lost focus in active documents.
- Add `validateA2uiAccessibility` to `@cognitap/radiant/a2ui`, a pure check of A2UI surfaces against per-entry accessibility rules with optional safe fixes; `A2uiSurface` warns in development, and every registry entry must declare `accessibility` rules.

## 0.0.91

- `ToastViewport` anchors to logical inline-end so notifications appear on the left in RTL.
- `Collapsible`, `Accordion`, `Spoiler`, and `NavLinkGroup` mirror their disclosure chevron in RTL.
- `TimeInput` keeps numeric clock segments (`hour:minute[:second]`) left-to-right in RTL while keeping `dayPeriod` in the ambient flow.
- `Switch`, `Checkbox`, `Radio`, and `TagsInput` forward direct `dir` overrides to their root wrappers, and `ScrollArea` and `ToggleGroup` react to dynamic ancestor direction changes.

## 0.0.90

- InlineEdit supports single-line editing with explicit save, cancel, and validation.

- DateField offers localized segmented date entry and submits an ISO civil date.

- ListBox provides an always-visible single or multiple chooser for rich options and native forms.

- RangeSlider sets lower and upper numeric bounds on one track with two native form controls.

## 0.0.89

- Indicator keeps its marker next to the target in a stretching grid.

## 0.0.88

- Rating hides its decorative radio markers when using the standalone stylesheet.

- RingProgress shows native progress or meter readings with themed circular arcs, segments, and spring motion.

- NumberFormatter displays localized numbers, currencies, percentages, and units in inline text.

- Indicator pins a dot or capped count to a logical corner and supplies a status-aware name for the target.

## 0.0.87

- Dropzone includes its padding and borders in its width when using the standalone stylesheet.

## 0.0.86

- Dropzone clears its feedback on native form reset in WebKit.

- The compiled stylesheet hides Dropzone's duplicate file controls and Spoiler's summary when all content fits.

## 0.0.85

- Highlight marks text matches while preserving the original text, with optional case sensitivity and diacritic folding.

- Spoiler previews long content at a fixed height and uses the themed disclosure motion to expand it.

- CopyButton copies text with a temporary confirmation and visible retry guidance when the clipboard is unavailable.

- Tour anchors non-modal onboarding steps to page controls and moves focus as participants navigate.

- Dropzone adds drag-and-drop file selection, native browsing, and file type, size, and count checks.

## 0.0.84

- ColorInput combines editable color text, a swatch preview, and ColorPicker with native validation and submission.

- ColorPicker edits OKLCH, hex, and RGB colors with keyboard controls, swatches, and optional browser sampling.

- Rating provides a native radio-group rating input and a read-only display with accessible score text.

- DataTable adds sortable columns, row selection, sticky headers, and windowed rows to semantic tables.

- Timeline presents dated events with native timestamps, themed indicators, and an active event.

- Stepper shows current, completed, upcoming, and error states in horizontal or vertical flows with linear or free navigation.

- Cascader picks a path through linked listboxes with per-level loading and direction-aware keyboard navigation.

- TreeSelect reuses Tree in Select’s popup and shows selected paths or tags with native form submission.

- Tree supports keyboard navigation, single and multiple selection, mixed checkboxes, async children, and fixed-height virtualization.

- Horizontal sliders in RTL follow the visual direction of the arrow keys across browsers.

- LocaleProvider’s bilingual report story shows keyboard navigation in French tabs nested in a Hebrew report.

## 0.0.83

- TimeInput accepts a `style` prop for per-instance styling, including the inline AM/PM text and underline colors.

- DateRangePicker accepts `defaultFocusedDate` for an empty range and can complete a range in the calendar after an end date is typed first.
- DateRangePicker connects both fields to shared descriptions and errors from a surrounding Field group.

- DatePicker accepts `defaultFocusedDate` to open an empty field on the desired calendar date while keeping today and the selected value independent.

## 0.0.82

- Calendar accepts `defaultFocusedDate` to open on a date independently of the selection and today marker.

- TimeInput supports localized segmented wall-clock entry, a single inline AM/PM button, optional seconds, arrow stepping and ISO time submission with native forms.

- DateRangePicker combines localized start and end fields, a range Calendar and optional presets, and submits both ISO dates in native forms.

- DatePicker supports localized segmented date entry and Calendar selection, and submits an ISO date with native forms.

- Calendar supports keyboard date and range selection with localized weeks, Gregorian and Buddhist calendars, and unavailable dates.

- LocaleProvider supplies app and subtree locales for number editing and search. Use getLocaleAttributes in the root layout to set native language and direction before hydration.

## 0.0.81

- **Breaking:** AppShell drops `useSidebar`, the `sidebarId` prop and `useAppShell()`'s `collapsedControlled`, `openControlled` and `sidebarId`, which no layout needed. SidebarTrigger still points `aria-controls` at the navigation. Before: `useSidebar()?.collapsedControlled`, `<AppShell sidebarId="nav">`. After: `useAppShell()`, and read control from the `collapsed` or `open` you pass; omit `sidebarId`.
- **Breaking:** CarouselAutoPlay takes `playLabel` and `pauseLabel` instead of `children`, so its text names the next action in both states. Before: `<CarouselAutoPlay>Pause</CarouselAutoPlay>`. After: `<CarouselAutoPlay playLabel="Play" pauseLabel="Pause" />`. It no longer accepts `aria-label` or `aria-labelledby`, so `playLabel` and `pauseLabel` are the only way to name the control. The defaults stay `Play slides` and `Pause slides`; an empty label throws. `CarouselAutoPlayProps` is exported.
- **Breaking:** `useCarousel()` no longer returns `playing` or `setPlaying`; CarouselAutoPlay owns playback and the root sets `data-playing` while slides rotate. Before: `useCarousel()?.setPlaying(false)`. After: render `<CarouselAutoPlay />`.
- CarouselIndicators takes `controlSize`, so its buttons match the Previous and Next buttons beside them.
- **Breaking:** Charts no longer take `plotLabel`. The scrolling plot is named by the chart's `label`, so charts on one page no longer share the name "Chart plot". Before: `<LineChart label="Sessions" plotLabel="Sessions plot" … />`. After: `<LineChart label="Sessions" … />`.
- **Breaking:** the chart data table's caption, and so the table's accessible name, is the chart's `label`, without an English "data" suffix or a "Chart data" fallback. Before: `getByRole('table', { name: 'Sessions data' })`. After: `getByRole('table', { name: 'Sessions' })`. `ChartDataTable` accepts any `ReactNode` as `label`.
- Chart parts set `data-slot` (`chart-caption`, `chart-description`, `chart-plot`, `chart-legend`, `chart-disclosure`, `chart-empty`, `chart-tooltip`).
- MultiSelect draws one field well around its chips, input and buttons that reads `control.field`, and its list anchors to that well. Compose it with the new `MultiSelectControl` (or `ComboboxControl`); the default composition uses it.

## 0.0.80

- Form's render callback receives `focusInvalid` with `errors` and `pending`, as `useForm` does, so a review button needs no child component.
- **Breaking:** `useResizable()` no longer returns `controlled` or `orientation`, which no layout control needed. Before: `useResizable()?.orientation`. After: read the `orientation` you pass to `Resizable`.
- ResizableHandle sets `data-disabled` when the group is disabled or the handle has no room to move, beside `aria-disabled`.
- **Breaking:** NavigationMenu no longer takes `items`, and `NavigationMenuItemConfig` is removed. Triggers and contents register their own `value`, like Tabs, and a section is disabled on its trigger. Before: `<NavigationMenu items={[{ value: 'learn' }, { value: 'docs', disabled: true }]}>` … `<NavigationMenuTrigger value="docs">`. After: `<NavigationMenu>` … `<NavigationMenuTrigger value="docs" disabled>`. A `value` or request that names no mounted, enabled trigger leaves the menu closed instead of throwing, duplicate trigger or content values throw once mounted, and trigger and panel IDs end in the value instead of its index.

## 0.0.79

- A segmented ToggleGroup indicator follows an ancestor `dir` change.
- Combobox, Autocomplete and MultiSelect lists hide when an ancestor dialog or popover closes, and show again when that ancestor is visible if the list stays open.
- A timed Toast pauses while a touch is held. A touch hover does not pause it.
- TypeScript accepts `import '@cognitap/radiant/styles.css'` and `import '@cognitap/radiant/reset.css'` without a local CSS module declaration.
- Prose list padding and `pre` scrolling skip children marked `data-rad-not-prose` or `data-slot`, as the other prose rules already do. Inline code styling also skips code that is marked or sits inside a marked element.
- **Breaking:** class merging no longer reads an unhinted token utility as a size, width, style or font family, which Tailwind never did. Replace `className="text-(--rad-tabs-font-size)"` with `className="text-(length:--rad-tabs-font-size)"`. This removes about 75 KB of minified JavaScript from every bundle, and `styles.css` drops the token utility classes no component uses, such as `.gap-(--rad-tabs-gap)`.
- Declare `react-dom` `^19.3.0` as a peer dependency next to `react`. Popover, Select, Combobox, Tooltip and AppShell import it.
- `styles.css` no longer defines utility classes that no component uses, such as `.container`, `.collapse`, `.table`, `.hidden` and `.border`, so host elements with those class names keep their own styles. It also no longer sets or reads Tailwind's `:root` variables, such as `--spacing`, so a page's own `--spacing` leaves component sizes alone.

## 0.0.78

- Show required and range errors from NumberField, TagsInput and MultiSelect on their own FormField instead of FormError.
- **Breaking:** Fieldset styles its legend through `parts.label`, like Field, RadioGroup and CheckboxGroup. Before: `<Fieldset legend="Shipping" parts={{ legend: … }} />`. After: `<Fieldset legend="Shipping" parts={{ label: … }} />`.
- RadioGroup passes its `form` prop to every radio, so a group placed outside its form submits its value.
- Checkboxes in an invalid CheckboxGroup show the invalid border, as radios in an invalid RadioGroup do.
- Radios outside an invalid RadioGroup keep their normal border, even inside a Form with errors.
- Keep a caller's `data-slot` tokens after the family's own on Link, Input, Textarea, Checkbox, Switch, Radio, Slider, FileInput, the Select, Combobox, Autocomplete, MultiSelect and Command parts, TooltipContent and the Dialog, AlertDialog and Drawer content, title and description, instead of replacing them.
- Draw every keyboard focus ring from the family focus overrides and the `focus` tokens. Carousel, Toast, ScrollArea, CodeBlock, ContextMenu, Table, Select, Combobox, NativeSelect, NavLink, Resizable, AppShell and chart points ignored some of them, such as `focus.style`.
- Add `focusWidth`, `focusOffset` and `focusStyle` to the `select` and `combobox` overrides, and `focusStyle` to `nativeSelect`, `inputGroup`, `navLink` and `resizable`.
- Highlight the focused Menu, ContextMenu and Menubar item with the accent fill that Select and Combobox options use, instead of a faint tint.
- **Breaking:** menu rows (MenuItem, MenuCheckboxItem, MenuRadioItem, MenuSubTrigger and their ContextMenu and Menubar versions) no longer accept `variant`, `controlSize`, `iconOnly` or `fullWidth`, which never changed how they looked, and no longer render `data-variant` or `data-control-size`. Before: `<MenuItem variant="solid" controlSize="small">Delete</MenuItem>`. After: `<MenuItem>Delete</MenuItem>`.
- **Breaking:** menu row `tone` now colors the row and takes `neutral` (the default), `warning` or `danger`, so `data-tone` is `neutral` unless set. Before: `<MenuItem tone="danger">` rendered `data-tone="danger"` and looked like any other row; `tone="accent"` was accepted. After: `<MenuItem tone="danger">` has danger text and a solid danger highlight; use `neutral` instead of `accent`. Theme the rest colors with `menu.itemWarningColor` and `menu.itemDangerColor`.
- Menu rows set `data-disabled` when disabled, and checked MenuCheckboxItem and MenuRadioItem rows set `data-selected`, beside their ARIA attributes. Disabled MenubarTriggers set `data-disabled` too.
- **Breaking:** Dialog, AlertDialog, Drawer and Command content carry a `<family>-content` slot, like every other overlay. Before: `data-slot="dialog"`, `"dialog alert-dialog"`, `"dialog drawer"`, `"dialog command"`. After: `"dialog-content"`, `"dialog-content alert-dialog-content"`, `"dialog-content drawer-content"`, `"dialog-content command-content"`; select `[data-slot~="drawer-content"]` instead of `[data-slot~="drawer"]`.
- **Breaking:** Breadcrumb, Pagination, ToastViewport and CommandInput require `aria-label` or `aria-labelledby` and throw without one, instead of defaulting to an English name. Before: `<Pagination>`. After: `<Pagination aria-label="Pages">`.
- CarouselViewport takes the Carousel's name instead of "Slides", and a Toast without a ToastTitle needs `aria-label` or `aria-labelledby` instead of being called "Notification".
- Add `removeLabel` to TagsInput, ComboboxTags and MultiSelectTags, a function from a tag's text to its remove button's name. It defaults to `Remove ${text}`.
- NavigationMenuViewport takes `aria-label` and `aria-labelledby`. Closed, it takes the NavigationMenu's name instead of "Navigation sections".
- Popover, Menu, MenuSub, Menubar, HoverCard, Dialog, AlertDialog, Drawer, Command, Combobox, Autocomplete, MultiSelect and AppShell's SidebarTrigger triggers set `data-state="open|closed"` beside `aria-expanded`, like Select and NavigationMenu triggers.
- NavLink, NavigationMenuLink, PaginationLink, PaginationButton, BreadcrumbLink, BreadcrumbPage and the current Carousel indicator set `data-selected` on the current item, beside `aria-current`, so `[data-selected]` selects every current or selected item.
- Boolean data attributes are empty when set: AppShell and Sidebar `data-collapsed`, AppShell `data-mobile`, SidebarContent `data-expanded-only`, NavigationMenu `data-disabled`, CodeBlock `data-line-numbers` and Toast `data-queued` and `data-paused`. Before: `[data-collapsed="true"]`. After: `[data-collapsed]`. A running Toast had `data-paused="false"`; now it has no `data-paused`.

## 0.0.77

- Draw the native scrollbars of Dialog, Drawer, Popover, Tooltip, Toast, NavigationMenu, Select, Combobox, TableContainer, Textarea, Tabs lists and the Carousel viewport like AppShell's: ScrollArea's thumb color on a clear track.

## 0.0.76

- Draw the Sidebar and AppShellMain scrollbars as a ScrollArea-colored thumb on a clear track, instead of the browser's default gutter.

## 0.0.75

- Fix thick borders on the unbordered sides of the AppShell header, Sidebar, CodeBlock header and table rows when the optional reset is not imported.

## 0.0.74

- Add FileInput, a native file input presented with a Button choose action and the chosen file names, which works in Field and native forms.
- Add `description` to Radio, shown under the label and linked to the input with `aria-describedby`, with a `parts.description` style.
- Add `onValueChange(value: number)` to Slider, beside the native `onChange`.
- Add `thumbWidth`, `thumbHeight` and `thumbBorderStyle` slider tokens. `thumbSize` still sizes both axes when they are unset, and the border style falls back to `control.borderStyle`.
- Add `steppers={false}` to NumberField to hide the increment and decrement buttons. Arrow and Page keys still step the value.
- Set Collapsible and Accordion trigger and content padding separately with `--rad-collapsible-trigger-padding` and `--rad-collapsible-content-padding`. Both fall back to `--rad-collapsible-padding`, so existing themes look the same.
- Keep a closed Popover, Tooltip or Dialog hidden even when application CSS sets its `display`.
- Pressed Buttons and ToggleGroup items mix 20% of their text color into their fill, so the pressed state stays visible when `control.selected` matches a variant's rest look, as Radiant's outline buttons did. Set `components.button.selectedLayer` to change the amount.

## 0.0.73

- Reserve ScrollArea's scrollbar space only on an axis that overflows, so short CodeBlocks and lists lose their empty 24px gutter.
- Keep visually hidden and other absolutely positioned content inside AppShellMain and Sidebar, so it scrolls with them instead of making the page taller.

## 0.0.72

- Draw the selected tab and the active NavLink with `control.selected`, and the Tabs list with `control.track`. Tab triggers take the action voice and corners concentric with the list, and Tabs content takes the surface radius and corner shape.
- Take the NavLink active weight from `typography.headingWeight` and the current breadcrumb's font from the label role.
- Give Badge, Tag, Kbd and Avatar the control radius, corner shape, border width and border style. Badge, Tag and Avatar take the action voice and Kbd its text transform. Avatar stays round unless the control radius is `0px`.
- Wrap TagsInput's tags and text input in one field well that reads `control.field`.
- Stop chart points inheriting Button's pressed shape and shadow, and take the chart caption weight from the title role.
- Keep inline actions free of the theme's button highlight and sheen.
- Give Neon and Ticket avatars the control radius.
- Draw Popover, HoverCard, Menu, ContextMenu, Menubar, Select, Combobox, Command, Tooltip, Dialog, AlertDialog, Drawer and the NavigationMenu viewport with the overlay role: `surface.overlayBackground`, `surface.overlayShadow` and `surface.backdropFilter`. Tooltips keep their own background.
- Highlight rows in menus, listboxes and Command with `control.item`, and give them corners concentric with their panel.
- Mark the chosen Select and Combobox option and the open Menubar menu with `control.selected` when a theme sets it.
- Style menu items as rows. They no longer inherit Button's uppercase, pressed shape, shadow or backdrop.
- Round Drawer's edges that face the page with the surface radius.
- Give Tooltip the surface corner shape and a radius capped at `0.5rem`, and the Menubar the control corner shape and the track border width.
- Fix the NavigationMenu viewport border width, which read a missing token, and use the overlay shadow.
- Set menu, Select and Command group labels in the `ui-label` role.
- Glass frosts every floating panel through `surface.backdropFilter`, without per-component overrides.
- Draw surfaces with the whole `surface` role. Alert, Toast, TableContainer, EmptyState, CodeBlock and the Carousel viewport take the surface corner shape. Table rows and borders, CodeBlock, EmptyState's solid variants and Separator take the surface border style. Card, Alert, Toast and Collapsible take the surface backdrop filter.
- Give Collapsible, Accordion items and TableContainer the surface shadow, overridable with `components.collapsible.shadow` and `components.table.shadow`.
- Tint Collapsible and Accordion triggers on hover.
- Set Table column headers in the action voice at the small control font size.
- Round InlineCode at half the control radius, capped at 0.375em, with the control corner shape.
- Draw the current Carousel indicator with `control.selected`.
- Set the Sidebar label in the UI title typography role.
- `control.indicator.thumbShadow` now defaults to `none`, and `control.track.background` and `control.track.borderWidth` default to unset, so each family keeps its own look until a theme sets them. Before, they defaulted to a small shadow, `color.neutral` and `0px`.
- Give Checkbox, Radio and Switch the `control.indicator` shadows, and the Switch and Slider thumbs `thumbShadow`. Checkbox and Radio boxes scale with `motion.pressScale` while pressed.
- Draw Progress, Meter, Skeleton, the Slider rail, ScrollArea's rail and Resizable's hover with `control.track`: background, border width and shadow.
- Cap Switch, Slider, Progress, Meter and ScrollArea corners at half their thickness, and give them the control corner shape. A `0px` radius gives bars. Progress and Meter no longer force a pill.
- Make the Switch thumb corner concentric with its track.
- Take the Progress and Meter border width and style from the control tokens instead of the surface ones. Skeleton takes the surface corner shape.

## 0.0.71

- Draw Input, Textarea, NativeSelect, InputGroup, OTPField, Select and Combobox wells with `control.field`: background, border color, shadow and backdrop filter. InputGroup gains the control corner shape and border style.
- Style the Select trigger as a field. It no longer inherits Button's uppercase, sheen, hover lift or pressed shape, and it does not scale on press.
- Keep NumberField steppers, the PasswordInput toggle and Tag's remove button flat, in the field's voice, whatever the theme gives Button.
- Add role tokens so a theme styles every family that plays a role at once: `control.action`, `control.field`, `control.indicator`, `control.track`, `control.selected`, `control.item`, `surface.overlayBackground`, `surface.backdropFilter` and the `motion` press keys. Button, ButtonGroup, ToggleGroup and Pagination read them.
- Draw pressed toggles, the current page and the segmented ToggleGroup indicator with `control.selected`. Segments and the indicator now use corners concentric with their track.
- Keep ButtonGroup's inner corners square while a segment is pressed.
- Rewrite the example themes so each shows a distinct design language, and add Neon and Editorial. Breaking: `expressive` is removed from `@cognitap/radiant/examples`; start from `soft` or `jelly` instead.

## 0.0.70

- Add an optional charts entry with SVG line, bar, area and pie charts, palette-derived colors, native data tables and keyboard-reachable tooltips.

## 0.0.69

- Add Carousel with native scroll snap, direction-aware controls, drag navigation and opt-in autoplay that pauses for interaction and reduced motion.

## 0.0.68

- Add Form with native validation, Field error mapping, asynchronous submission and optional form-library integration.

## 0.0.67

- Add Sidebar and AppShell with native landmarks, collapsible navigation, a responsive Drawer and application-owned layout persistence.
- Keep Button motion cleanup safe after its owning iframe is removed.

## 0.0.66

- **Breaking:** CheckboxGroup builds on Field's group layout and takes `label` instead of `legend`. Before: `<CheckboxGroup legend="Channels" parts={{ legend: … }} />`. After: `<CheckboxGroup label="Channels" parts={{ label: … }} />`. Its root `data-slot` is `field checkbox-group`; match `[data-slot~="checkbox-group"]` instead of `fieldset`.
- **Breaking:** CheckboxGroup `value` and `defaultValue` are `string[]`, matching `onValueChange`. Before: `readonly string[]` was accepted. After: pass a mutable array.
- CheckboxGroup adds `required` and `requiredIndicator`. `required` blocks native form submission until at least one enabled option is checked.
- A group Field's label is spaced from its options by the group gap, so RadioGroup's label no longer sits flush against the first radio.
- PasswordInput's reveal button no longer sets `aria-pressed`; its Show and Hide label alone says what it does.
- ButtonGroup keeps a caller's `data-slot` tokens after `button-group` instead of dropping them.
- DrawerHandle accepts `aria-labelledby` as its accessible name, as well as `aria-label`.
- **Breaking:** CommandTrigger's props are DialogTrigger's, so toggle props are rejected the same way. Before: an object holding `pressed: true` could be typed as `CommandTriggerProps`. After: a type error. Runtime is unchanged; the trigger already ignored them.

## 0.0.65

- **Breaking:** MenuItem, MenuSubTrigger, and the ContextMenu and Menubar item and sub-trigger parts no longer accept `pressed`, `defaultPressed`, `onPressedChange` or `aria-pressed`, and ignore them at runtime. Before: `<MenuItem pressed>Bold</MenuItem>` rendered a `menuitem` with `aria-pressed="true"`. After: a type error; use `<MenuCheckboxItem checked onCheckedChange={...}>` for a toggled command.
- **Breaking:** PopoverClose no longer accepts toggle props, matching DialogClose. Before: `<PopoverClose pressed />` rendered `aria-pressed`. After: a type error, ignored at runtime.
- **Breaking:** ToggleGroup chooses its treatment with `variant`. Before: `<ToggleGroup appearance="segmented">`, `data-appearance`, `ToggleGroupAppearance`, `useToggleGroup().appearance`. After: `variant`, `data-variant`, `ToggleGroupVariant`, `useToggleGroup().variant`.
- **Breaking:** ToggleGroupItem marks selection with a boolean `data-selected`. Before: `data-state="on"` / `"off"`. After: `data-selected` on pressed items. `aria-pressed` is unchanged.
- **Breaking:** ToggleGroup and Toolbar use the shared `Orientation` type. Before: `ToggleGroupOrientation`, `ToolbarOrientation`. After: `Orientation`, with the same values.
- Add `ContextMenuRenderProps` and `ToggleGroupRenderProps`. MenuCheckboxItem uses the shared `CheckedOwner` type.

## 0.0.64

- Add NavigationMenu with native navigation links, delayed hover disclosure and a shared spring viewport.

## 0.0.63

- **Breaking:** Combobox chooses one or many with `type`, defaulting to `'single'`. Before: `<Combobox multiple />`, `useCombobox({ multiple: true })`. After: `<Combobox type="multiple" />`, `useCombobox({ type: 'multiple' })`.
- **Breaking:** Combobox, Autocomplete and MultiSelect name their load-failure text `errorText`, matching `loadingText`, `emptyText` and Command. Before: `<Combobox error="Could not load" />`. After: `<Combobox errorText="Could not load" />`.
- **Breaking:** ComboboxTrigger, ComboboxClear and the Autocomplete and MultiSelect triggers and clears no longer accept toggle props, and ignore them at runtime. Before: `<ComboboxTrigger pressed />` rendered `aria-pressed`. After: a type error, and no `aria-pressed`.
- **Breaking:** TagsInput styles its validation message through `parts.error`, with `data-slot="tags-input-error"`. Before: `parts.message`, `[data-slot="tags-input-message"]`.
- Combobox, Autocomplete and MultiSelect accept `aria-invalid` on the root and forward it to the input.
- Add `ComboboxRenderProps` and `AutocompleteRenderProps` for the `render` prop on Trigger and Clear.

## 0.0.62

- Add Resizable with draggable and keyboard separators, bounded collapsible panels, direction support and application-owned layout persistence.

## 0.0.61

- **Breaking:** Pagination page links and buttons default to `controlSize="medium"`, matching Button and Link. Before: `<PaginationLink href="?page=2">` rendered small. After: it renders medium. Pass `controlSize="small"` to keep the old size.
- Breadcrumb, Pagination and TableContainer check their names with the shared rule. A blank `aria-label` beside a nonempty `aria-labelledby` no longer throws, TableContainer accepts both, and the error reads "<Name> requires aria-label or aria-labelledby."

## 0.0.60

- Add NumberField with locale-aware decimal, percent and currency editing, keyboard stepping, blur clamping and raw native form values.

## 0.0.59

- Add CodeBlock and InlineCode with consumer-supplied highlighting, line numbers, keyboard scrolling and copy feedback.

## 0.0.58

- Progress fallback text matches Meter: `aria-valuetext` when given, otherwise "value of max". Before: "value / max", ignoring `aria-valuetext`.

## 0.0.57

- **Breaking:** DialogTrigger and DialogClose no longer accept `pressed`, `defaultPressed`, `onPressedChange` or `aria-pressed`, and ignore them at runtime. The AlertDialog, Drawer and Command trigger and close parts change with them. Before: `<DialogTrigger defaultPressed>` rendered `aria-pressed` beside `aria-expanded`. After: a type error, and no `aria-pressed`.
- **Breaking:** PopoverTrigger and MenuTrigger no longer accept toggle props. Before: `<PopoverTrigger defaultPressed />` type-checked and rendered `aria-pressed` beside `aria-expanded`. After: `pressed`, `defaultPressed`, `onPressedChange` and `aria-pressed` are rejected by the types and ignored at runtime.
- **Breaking:** ToastAction and ToastClose no longer accept toggle props, because neither is a toggle. Before: `<ToastAction pressed altText="…">` rendered `aria-pressed`. After: a type error, ignored at runtime.

## 0.0.56

- Fix EmptyState's no-results boundary to honor its border-width token.

## 0.0.55

- Add EmptyState for first use, empty searches and recovery, with consumer-chosen headings and actions.

## 0.0.54

- Add the `Orientation` type, used by Slider and Tabs.
- Select accepts `aria-invalid` on the root and forwards it to the trigger. `SelectTrigger`'s own `aria-invalid` still works and wins.
- Select accepts `readOnly`. The trigger stays focusable and sets `aria-readonly`, but opens nothing and the value doesn't change. The value still submits, and a read-only Select is not checked for `required`.
- Add the `SelectRenderProps` and `TabsRenderProps` types for `SelectTrigger` and `TabsTrigger` `render`.
- **Breaking:** SelectItem marks selection with a boolean `data-selected`. Before: `data-state="checked"` / `data-state="unchecked"`. After: `data-selected` present or absent. `aria-selected` is unchanged.
- **Breaking:** SelectTrigger no longer accepts toggle props. Before: `<SelectTrigger defaultPressed />` type-checked and made the trigger a toggle. After: `pressed`, `defaultPressed`, `onPressedChange` and `aria-pressed` are rejected by the types and ignored at runtime.
- **Breaking:** TabsTrigger marks the selected tab with a boolean `data-selected`. Before: `data-state="active"` / `data-state="inactive"`. After: `data-selected` on the selected tab only. `aria-selected` is unchanged.
- **Breaking:** TabsContent no longer sets `data-state`. Before: `[data-state=active]` matched the visible panel. After: target `[role=tabpanel]:not([hidden])`.

## 0.0.53

- Add Command.

## 0.0.52

- Field passes `aria-invalid` and `aria-describedby` from its root to the control it labels.
- RadioGroup `name` is optional. Without it, a generated name keeps grouping, arrow keys and form submission working.
- **Breaking:** Checkbox no longer accepts `readOnly`, which a native checkbox ignores. Before: `<Checkbox readOnly />` still toggled and submitted. After: a type error; use `disabled` or show the value as text.
- **Breaking:** Radio no longer accepts `readOnly`, for the same reason. Before: `<Radio readOnly />` still checked on click. After: a type error.

## 0.0.51

- Add Autocomplete.

## 0.0.50

- Add NavLink.

## 0.0.49

- Add PasswordInput.

## 0.0.48

- Add Meter.

## 0.0.47

- Add NativeSelect.

## 0.0.46

- Fix InputGroup addon focus.

## 0.0.45

- Add InputGroup.

## 0.0.44

- Add Kbd.

## 0.0.43

- Add ButtonGroup.

## 0.0.42

- Fix OTPField selection.

## 0.0.41

- Add OTPField: numeric/alphanumeric slots over one native input.

## 0.0.40

- Add Combobox multiple mode, MultiSelect, TagsInput and removable Tag.

## 0.0.39

- Fix nested Drawer alignment.

## 0.0.38

- Add Drawer.

## 0.0.37

- Add Menubar.

## 0.0.36

- Add ContextMenu.
- Add Menu groups, labels and separators.
- Add checkable Menu items.
- Add Menu submenus.
- Add MenuItem.closeOnSelect.

## 0.0.35

- Add HoverCard.
- Track inline anchor text changes in popup placement.
- Keep popup portals outside phrasing-only hosts.

## 0.0.34

- Add Toolbar.

## 0.0.33

- **Breaking:** ButtonProps union. Before: `interface` extension. After: type intersection and distributive omission.
- Add ToggleGroup.
- Add Button pressed/defaultPressed/onPressedChange.

## 0.0.32

- Add ScrollArea.

## 0.0.31

- Add AspectRatio.

## 0.0.30

- Add CheckboxGroup.

## 0.0.29

- Add Fieldset.

## 0.0.28

- Add Table.
- Preserve external Link defaults in Pagination direction links.

## 0.0.27

- Add Pagination.

## 0.0.26

- Add Breadcrumb.

## 0.0.25

- Add Avatar.

## 0.0.24

- Add Badge.

## 0.0.23

- Add Separator.

## 0.0.22

- Add Skeleton.

## 0.0.21

- Add Spinner.

## 0.0.20

- Add Progress.

## 0.0.19

- Add Toast.

## 0.0.18

- Add Alert.

## 0.0.17

- Add Menu.

## 0.0.16

- Add Tooltip.

## 0.0.15

- Add Popover.

## 0.0.14

- Add AlertDialog.

## 0.0.13

- Add Combobox.

## 0.0.12

- Add Tabs.

## 0.0.11

- Add Slider.

## 0.0.10

- Add draggable Switch: Field, forms, sizing, themes.

## 0.0.9

- Add Textarea: Field, forms, themes, resizing.

## 0.0.8

- Add Select: item focus, Field/forms, themes, springs, stable trigger-width alignment.

## 0.0.7

- **Breaking:** example themes moved from core. Before: `import { jelly, themes } from '@cognitap/radiant'`. After: `import { jelly, themes } from '@cognitap/radiant/examples'`. `defaultTheme` stays in core; `themeDefinitions` exposes example definitions.

- Reconcile pre-hydration disclosures: Collapsible adopts local changes once; controlled Collapsible/Accordion restore ownership without requests.

- Align Card/compound-part minimum widths.

- Let Accordion shrink in narrow grid/flex layouts.

- Update disclosure resize/inert cleanup; retain native pre-hydration fallback and motion-off height/markers.

- Bound Dialog exits to two seconds/500 descendants; skip nested dialogs and customized built-ins.

- Wrap Radio/Checkbox labels; retain indicator size.

- Release MotionLink springs on lost capture/removed destinations; preserve native navigation.

- Bind Button presses to active input; cancel unavailable motion and theme-off lift/shift.

## 0.0.6

- Add opt-in `/motion` and `/motion/react` springs with serializable theme profiles; root imports stay engine-free.
- Add `MotionProvider` for Button/Dialog actions, disclosure height and Dialog presentation; dismissal/focus stay immediate.
- Add `MotionLink` spring feedback for action-shaped links.
- Add one-axis drag with release, snapping, cancellation and keyboard alternatives.
- Add `useSpringFollow` for changing targets and `useSpringLayout` for grid and flex resize and reorder.
- Motion follows live reduced-motion settings, `motion="off"` and the theme's motion profile. See [motion](docs/motion.md).

## 0.0.5

- Add typography recipes (`typography.typesetting`): Body/Headings/UI/Code fonts, 16 styles and separate prose/UI rhythms.
- Add the React-free `@cognitap/radiant/typography` entry with `generateTypography`.
- Add `data-rad-prose`, `data-rad-text` and `data-rad-type-container` HTML hooks.
- Add font axis ranges (`ThemeFontAxis`) to theme document font metadata.
- **Breaking:** component text now uses the UI typography roles. UI line heights are explicit, and checkbox, radio and disclosure labels use the label weight. Check wrapping in your layouts.

  Earlier leaves still apply. Migrate to roles:

  | Before                             | After                         |
  | ---------------------------------- | ----------------------------- |
  | `family`, `bodySize`, `bodyWeight` | `roles['ui-body']`            |
  | `smallSize`                        | `roles['ui-supporting'].size` |
  | `headingSize`, `headingWeight`     | `roles['ui-title']`           |
  | `labelWeight`                      | `roles['ui-label'].weight`    |

  Apply `family` and `letterSpacing` to all four roles.

## 0.0.4

- Add versioned, JSON-portable `ThemeDocument` with section merge, replace and reset.
- Add `generateColorWall` in `@cognitap/radiant/color`: 18 palettes from one brand color, with Classic, Balanced and Expressive presets.
- Add `recommendColorPalette`: a working palette, light and dark color roles, and contrast checks.
- Add `updateThemeAppearance` for palettes, spacing, density, radius, border, elevation and backdrops.

## 0.0.3

- Add Link, Field, Input, Checkbox, RadioGroup, Radio, Dialog, Collapsible, Accordion and Card using native elements.
- Add `defineTheme` and `ThemeScope`: typed shared tokens, per-component overrides, and light, dark and system modes.
- Add eight presets as named exports and readonly `themes`.
- Add Button `variant`, `tone`, `controlSize`, `pending`, `iconOnly`, `fullWidth` and `render`.
- Add `ThemeStyle` for typed `--rad-*` variables in `style`.
- `data-slot` holds a set of identities. Select with `~=`, as in `[data-slot~="button"]`.
- Controlled/default pairs and ownership changes during a mount throw.
- **Breaking:** CSS variables gain the `--rad-` prefix and semantic names.

  ```css
  /* Before */
  --color-primary: #166534;
  /* After */
  --rad-color-accent: #166534;
  ```

  | Before                                                  | After                                                                                      |
  | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
  | `--color-background`                                    | `--rad-color-surface`; the page canvas is `--rad-surface-canvas`                           |
  | `--color-foreground`, `--color-border`, `--color-focus` | `--rad-color-foreground`, `--rad-color-border`, `--rad-color-focus`                        |
  | `--color-primary`, `--color-primary-foreground`         | `--rad-color-accent`, `--rad-color-accent-foreground`                                      |
  | `--color-primary-hover`, `--color-primary-active`       | Removed; hover and press colors derive from the accent                                     |
  | `--color-disabled`, `--color-disabled-foreground`       | Removed; disabled controls use `--rad-color-disabled-*` and `--rad-state-disabled-opacity` |
  | `--radius-control`                                      | `--rad-control-radius`                                                                     |

- **Breaking:** the Tailwind route no longer registers unprefixed aliases. Replace `bg-primary` with `bg-(--rad-color-accent)` and `rounded-control` with `rounded-(--rad-control-radius)`.

## 0.0.2

- Tooling/documentation cleanup; no API change.

## 0.0.1

- First public release.
