# toghen-ui — Specifications

> **Audience:** developers and AI coding agents changing the design system or the plugin's screen. The history, the rulings and the open questions are in [decisions.md](./decisions.md).

---

## Purpose

`toghen-ui` (`@toghen/ui`) is the design system of the Toghen Figma plugin's screen, and Toghen's playground: the one design system in this repository used for real. The plugin uses it as an application uses its design system, so a gap in Toghen shows first as a defect on the screen, and is fixed in Toghen, generically.

The package boundary is the point. What the plugin may know of its design system is what the package exports.

Visual changes come from the design system. The [UX rulebook](https://codeberg.org/Toghen/figma/src/branch/main/ux-rulebook.md) still binds where things go and what they say.

## Principles

1. **Light DOM, no shadow root.** The cascade is the design: the tokens declare, the components read, and the application's rules come after. A shadow root would cut each component off from it.
2. **A custom element only where script is needed.** A button, a field, a select, a checkbox and the rest are native elements with a class, so their keyboard, focus and form behaviour is the platform's.
3. **Variants and sizes are `data-*` attributes,** on a native or a custom element alike. Never a modifier class.
4. **States come from the platform and ARIA, never from classes.** Script sets ARIA; the stylesheet reads it. One attribute is both the meaning and the look.
5. **Three token tiers.** Primitives (the scales and the palette), semantic (`tg.bg`, `tg.text`, `tg.status`) and a component tier keyed by CSS property. A component's values refer to the semantic tier, and no component token holds a literal the semantic tier could hold.
6. **A variant and its states are parts of one group.** Nothing is mapped by a table: the attribute values and the subgroup names are the same words.
7. **Text styles are tokens,** so the same recipe is a text style in Figma and a `data-text` role on the page.

## What it holds

```
toghen-ui/
├── tokens/                          the resolver document and its token files
│   ├── toghen-plugin.resolver.json
│   ├── base.tokens.json             what does not vary
│   └── theme.light.tokens.json, theme.dark.tokens.json
├── src/
│   ├── index.css                    the layers, the mixins and the imports
│   ├── tokens.css                   the token layer
│   ├── base.css, fonts.css          the page's text and faces
│   ├── components/                  one stylesheet per component, one module per custom element
│   ├── elements.js, define.js       the custom elements
│   ├── keys.js                      the keyboard rules, as plain functions
│   └── icons.js                     the icon names and the icon map
├── scripts/build.mjs                writes dist/toghen-ui.css
├── scripts/gallery.mjs, dev/        the gallery
└── test/
```

The tokens are the design system's source. There is no compiled token code. The resolver has one set, `base`, and one modifier, `theme`, whose contexts `light` and `dark` are spelled as Figma's classes (`.figma-light`, `.figma-dark`) and as a data attribute. Variant, size and density are parts, not modifiers.

## What it exports

| Path | What it is |
|---|---|
| `@toghen/ui/resolver.json` | The resolver document. Read it with `@toghen/lib`'s `load`, which follows its references. |
| `@toghen/ui/tokens/*` | The token files. |
| `@toghen/ui/elements.js` | The eight custom elements, defined on import. |
| `@toghen/ui/icons.js` | The icon names and the icon map. |
| `@toghen/ui/styles.css` | The built stylesheet, `dist/toghen-ui.css`. Run the build first. |
| `@toghen/ui/build.mjs` | The build as functions, for tests. |

Consumers: the plugin's build reads `styles.css` and bundles `elements.js` and `icons.js`. The plugin's tests call the build.

## Components

Eighteen components, in two kinds.

- **Custom elements (eight):** `tg-dot`, `tg-chip`, `tg-segmented`, `tg-tabs`, `tg-callout`, `tg-card`, `tg-row`, `tg-list`. Script sets roles, labels and keys. They are light DOM, with no shadow root.
- **Native elements with a class (ten):** icon, swatch, monogram, divider, button, field, select, checkbox, dropzone, table.

Each component has one token group, keyed by CSS property. Its variants and states are subgroups, described in the next two sections.

## Parts

A part is a variant or a state of one component, written as a subgroup of the component's group. Each part holds only the tokens it changes. A component group, such as `tg.button`, has these parts:

- **Variants**, such as `primary` and `quiet`.
- **States**, such as `hover` and `disabled`, under the variant that needs them or directly under the component.
- **Combinations**, such as `primary.hover`, which nests the state inside the variant it belongs to.

### The vocabulary

The words a part is found by are the vocabulary. It maps each axis to its values and to the CSS that spells each value. It sits in the `com.toghen` extension of the root group, `tg`, so every group below it inherits it. The root vocabulary is:

| Axis | Spelled as | Values |
|---|---|---|
| `variant` | `[data-variant]` | primary, quiet, link, code, boxed |
| `size` | `[data-size]` | sm, xs, lg, xl |
| `density` | `[data-density]` | dense, roomy |
| `interaction` | `[aria-pressed]`, `[tabindex]` | toggle, interactive |
| `state` | `[data-state]` | drifted, upstream, absent, unread, connected, busy, idle, error |
| `drag` | `[data-over]` | over |
| `validity` | `[aria-invalid]`, on the element or a child | invalid |
| `composition` | a parent of rows or lists | flush |
| `selection` | `[aria-selected]`, `[aria-pressed]`, `[aria-checked]`, `:checked` | selected |
| `disclosure` | `[aria-expanded]` | open |
| `pointer` | `:hover`, `:active` | hover, pressed |
| `focus` | `:focus-visible` | focus |
| `availability` | `:disabled`, `[aria-disabled]` | disabled |

The first eight axes are attributes or, for `composition`, a parent that holds rows or lists. The last five are states. The root's selection spelling names `:checked` as well as the ARIA attributes, so a native checkbox reads as selected without one.

### Why this order

- **Precedence follows the vocabulary.** Where two parts match at once, the later axis wins. Within an axis, the later value wins.
- **Attributes come first, states after.** A state rule applies to every variant, so a hover looks the same on each one. A variant that needs its own look under a state nests that value, as `primary.hover` does, and the nested rule is more specific.
- **Availability comes last among the states.** A disabled control does not answer the pointer.

### Tone

The `tone` axis (`warn`, `err`, `ok`) is not on the root. It is declared on the five groups that use it: `tg.icon`, `tg.chip`, `tg.callout`, `tg.row` and `tg.table.cell`. A vocabulary applies to every group below it, so a tone on the root would read the semantic status groups (`tg.status.warn`) as parts. The shape `icon` is an attribute on a button and is not an axis, for the same reason. The cost is that the same spellings are written on five groups, and tone ranks after the root's state axes on those groups.

### Respellings

A component whose state sits on a child element respells that axis in its own vocabulary entry. The respelled value replaces the root's value for that axis. The other values stay, and the component's parts inherit the respelling.

| Group | Axes respelled | Spelled on |
|---|---|---|
| `tg.checkbox` | selection, focus, availability | the checkbox's input, `:has(> input …)` |
| `tg.field` | focus, availability | the field's input, `:has(> input …)` |
| `tg.row` | disclosure, focus, interaction | the row's summary button |

The document keeps one spelling per value at the root. A component says where its own states are.

## Layers

The stylesheet has three layers, in this order: `tg.tokens`, `tg.base`, `tg.components`.

| Layer | Holds | Role |
|---|---|---|
| `tg.tokens` | `tokens.css`: every token as a custom property, the defaults and each theme | The only layer that declares. |
| `tg.base` | `base.css` and `fonts.css`: the page's text and faces, and the `data-text` roles | Reads the tokens. |
| `tg.components` | One stylesheet per component | Reads the tokens. A part re-points a local property on its own element, which the component resets, so a component nested in another starts from its rest. |

An application's rules come after the sheet, unlayered, and can adjust a component when they must.

## Mixins

Each group becomes a mixin named by its path, with the root segment included: `tg.button` gives `--tg-button`, and `tg.checkbox.input` gives `--tg-checkbox-input`. A component applies its group's mixin in its own rule with `@apply`. The mixin brings the group's declarations, read as `var()` with the referenced token as fallback (the build uses `references: 'var'`), and its parts, nested. A token a part changes is read through a local property first, `var(--_tg-row-background-color, var(--tg-row-background-color, …))`, and the component resets the local property to `initial` at the start of its rule. A typography token is a mixin of longhands, named by its path, so the `data-text` roles apply it.

## Build

The build is one PostCSS pipeline, and the output keeps native CSS nesting.

1. **Toghen**, listed first, writes the token layer and the mixins from the resolver document. Unresolved references fail the build.
2. **The mixins polyfill** (`@csstools/postcss-mixins`), listed after it, expands each `@apply`.

The build used two passes until 13 October 2026, when the plugin learnt to write its mixins before the polyfill reads the sheet.

The fonts are embedded as data URIs, because the plugin's window has no network. The steps are in the [guide](./guide.md#build-the-stylesheet).

## Hand-written rules

Parts write every state of the components except two in `row.css`. Those, and one composed fill, stay by hand:

- **The closed detail of a row** (`row.css`). It is hidden with `display: none !important` unless its summary is open or the row is a selected option of a list. The rule joins the row to the list it sits in, and the design system has no token for a `display` value.
- **The wash is off over the detail** (`row.css`). A part reads the pointer on the row itself. This rule reads the pointer on the row's detail, a child.
- **The monogram's fill** (`monogram.css`) is composed in the rule from two token reads, because a colour that depends on a page's data cannot be a token. See [decisions.md](./decisions.md#3-a-colour-built-from-a-data-value-plus-tokens).

The row also reads its minimum height into a private property for its children. That is layout, not a state.

## Testing

`pnpm --filter @toghen/ui test` checks three things:

- The tokens: the resolver loads and resolves, the vocabulary is in order, the respellings keep the rest, and the structured W3C shapes come out as CSS.
- The built sheet: no directive or mixin is left in it, the layers are in order, and every state is a part.
- The custom elements' pure functions, such as the keys and the labels, with `node:test`. No DOM is needed.

The look is checked in the gallery and in the plugin's preview.
