# toghen-ui — Guide

How to build the design system's stylesheet, change a token, and add a part or a component. The design is in [specs.md](./specs.md).

## Build the stylesheet

```sh
pnpm --filter @toghen/ui build       # writes dist/toghen-ui.css
pnpm --filter @toghen/figma build    # the plugin, which reads that stylesheet
pnpm --filter @toghen/figma preview  # the plugin's screen in a browser, with a theme switch
pnpm --filter @toghen/ui gallery     # every component, variant, size, tone and state, at localhost:4175
```

Run the design system's build before the plugin's. The plugin reads `@toghen/ui/styles.css`, and that file is `dist/toghen-ui.css`.

The build runs in four steps:

1. `src/index.css` names the layers and imports each stylesheet. The build inlines each import as a block of its layer.
2. One PostCSS pipeline: Toghen writes the token layer (`@toghen contexts` in `src/tokens.css`) and the mixins (`@toghen mixins toghen-plugin` in `src/index.css`), the mixins polyfill expands each `@apply`, and the comments are stripped. A broken reference fails the build.
3. The fonts are embedded as data URIs.

## Change a token

1. Open the file for the token's kind. Values that do not vary are in `tokens/base.tokens.json`. A colour that differs by theme is in both `tokens/theme.light.tokens.json` and `tokens/theme.dark.tokens.json`, under the same path.
2. Edit the value in the W3C shape the other tokens use: `{colorSpace, components, hex}` for a colour, `{value, unit}` for a dimension.
3. Run `pnpm --filter @toghen/ui build` and `pnpm --filter @toghen/ui test`. The test checks that the document resolves and that the sheet builds clean. It does not judge the look.
4. Look at the change in the gallery, then in the plugin's preview.

## Add a part to a component

A part is a subgroup named after its value. For example, to give `tg.chip` an `info` tone:

1. In the vocabulary entry of the group that declares the axis, add the value and its spelling. The tone axis is declared on `tg.chip`, so add `"info": "[data-tone='info']"` there.
2. Add a subgroup of the component with only the tokens it changes, such as `tg.chip.info` with `backgroundColor` referring to `{tg.status.info.bg}`.
3. Build and look at it in the gallery.

Two cases come up often:

- **A variant with its own look under a state.** Nest the state inside the variant, as `tg.button.primary.hover`. A nested part is more specific than the state alone.
- **A state on a child element,** such as the input in a field. Respell the axis in the component's own vocabulary entry, as `tg.field` does for focus and availability, with a selector that reads the child.

## Style a new component

1. Add a token group `tg.<name>`, keyed by CSS property. Each value refers to a semantic token, such as `{tg.bg.card}`.
2. Add its parts, as above.
3. Write `src/components/<name>.css` with one rule for the element. Use the `tg-` prefix for the class and apply the group's mixin:

   ```css
   .tg-name {
     display: inline-flex;
     @apply --tg-name;
   }
   ```

4. Import the stylesheet in `src/index.css`, in the components layer.
5. If the component needs script, write `src/components/<name>.js`, define the element with `define`, and import it in `src/elements.js`. Otherwise write the native element with its class.
6. Add the component to the gallery in `dev/gallery.js`, then build and look at it.

## Part or modifier

An attribute on the component's own element is a part. An attribute on an ancestor is a modifier.

| Set on | Kind | Example |
|---|---|---|
| The component's element | Part | `data-variant="primary"` on a button |
| An ancestor | Modifier | `.figma-dark` on the page's root element |

A new part is a vocabulary entry and a subgroup. A new modifier is a new entry in the resolver document.
