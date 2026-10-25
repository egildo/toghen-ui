# toghen-ui — Decisions

The archive of toghen-ui's rulings: the gaps the design system found in Toghen, with what the component model did about each; the design reflection and roadmap that began the package; the build plan and migration that followed; and the questions still open. Sections are moved here whole. A status line under a heading says what has happened since. The current design is in [specs.md](./specs.md).

## Five gaps toghen-ui found in @toghen/postcss and @toghen/lib

> **Ruled and built 12 October 2026**; the rulings are in [toghen-postcss/decisions.md](https://codeberg.org/Toghen/postcss/src/branch/main/decisions.md#ruled-gaps-the-playground-found). Gaps 2, 3 and 5 are documented, not built. What remains in `toghen-ui` marked `TOGHEN GAP:` is the boxed checkbox and the disclosure row, which need a spelling per state (the pinned alternative of named spellings). Below is the investigation as it stood before the rulings.
>
> Investigated 11 October 2026, read-only, against the code at that date (line numbers will drift). Nothing here is ruled; the rulings start from the summary in [toghen-postcss/decisions.md](https://codeberg.org/Toghen/postcss/src/branch/main/decisions.md#ruled-gaps-the-playground-found), next session.

Read-only investigation, 11 October 2026, branch `toghen-ui`. Nothing in the repository was touched.

How the claims were checked. Code and docs were read at the lines given. Where a claim is about output, I ran the built `@toghen/postcss` (`toghen-postcss/dist/index.js`, newer than `src/index.ts` by modification time) over toghen-ui's real resolver document, or over a small synthetic one, from scripts kept in the scratchpad (`probe*.mjs`). Output quoted below is what those runs printed. Browser behaviour is never measured here; where I say how CSS behaves, it is from the repo's own specs or from well-established CSS rules, and I mark the rest.

Line numbers are in `toghen-postcss/src/index.ts` unless another file is named.

---

### 1. A component cannot respell a context for itself

> **Component model:** closed by respelling, not by the relay directive. A component respells the states it reads from a child in its own vocabulary entry (`tg.checkbox`, `tg.field`, `tg.row`), so the TOGHEN GAP pins and the generated rules that never matched are gone. The document's selection spelling names `:checked`.


#### What happens now (gap 1)

- A modifier context has one spelling for the whole document, read by `getContextSelector` (`toghen-lib/src/resolver/context-selector.ts`, whole file). In toghen-ui `focus=visible` is `:focus-visible`, `availability=disabled` is `:is(:disabled, [aria-disabled='true'])`, `selection=on` is `:is([aria-selected='true'], [aria-pressed='true'], [aria-checked='true'])` (`toghen-ui/tokens/toghen-plugin.resolver.json`).
- A block (`@toghen path;`) writes one sibling rule per non-default context of each element-state modifier its tokens depend on. It joins the document's spelling to the rule's own selector: `stateRules`, lines 1402-1439, the join at 1416-1427 (`part.trim() + spelling.selector`). No input from the author can change the spelling.
- Result for a field (probe, `@toghen toghen-plugin.tg.field;` on `.tg-field`): the generated rules are `.tg-field:focus-visible { --tg-field-outline-color: … }` and `.tg-field:is(:disabled, [aria-disabled='true']) { … }`. The label is neither focusable nor disableable, so these two rules are dead CSS that never match. That is why `field.css` writes `:focus-within` and `:has(> input:disabled)` by hand in the states layer, and pins the read with `@toghen mode focus=visible;` so the value is the state's.
- The governing text: `toghen-postcss/specs.md`, *Element states* (a block writes "its component's states", the selector is "the rule's selector joined to the context's spelling"), and *Element states against selectors, layers and pins* (the pin that names only element states keeps the ambient modifiers). The same file lists "leaving a state out of a block, for a component that handles disabled its own way" under "Not designed" (end of *Element states*). That is the nearest admitted neighbour of this gap.
- What `:toghen()` already does. It is allowed inside `:has()`, `:is()`, `:where()`, `:not()` and writes the document's spelling (reference.md, *`:toghen()`*, and specs.md, *A context as a selector*). I ran it: `.tg-field:has(> input:t(availability=disabled))` becomes `.tg-field:has(> input:is(:disabled, [aria-disabled='true']))`. Two limits showed up:
  1. A `:toghen()` nested in a pseudo-class sets no scope (line 1892: `findToghen(text).filter((f) => !f.nested)`). So a plain read inside that rule gives the rest value, not the disabled one (`color: var(--tg-field-color, #1e1e1e)`, probe). The author still needs the `@toghen mode` pin for the reads.
  2. Putting a block inside such a rule makes its generated state rules stack on the selector, which is wrong (`.tg-field:has(> input:is(:disabled, …)):is(:disabled, …)`). The block cannot be told "the states live on the child".
- The selection spelling is aria-based. A native `<input type="checkbox">` carries `:checked`, not `aria-checked`, unless the author adds the attribute. So for the checkbox, even `:has(> input:t(selection=on))` would not match a native box. The document's spelling for selection does not name `:checked`.

#### Missing, bug, or already possible? (gap 1)

Partly possible, partly missing.

- Already possible, no code: add `:checked` to the selection spelling (a document edit; `:checked` never matches a row, so it is harmless there). Then `:t(…)` inside `:has(> input …)` writes the selectors from the document, so a wrapper's own selectors need not be spelled by hand. This removes the duplicated spelling, not the duplicated list of declarations or the dead generated rules.
- Missing: any way to tell a block "this component's states are carried by a child". Two things need it: the sibling rules a block writes (selector shape), and the scope for single reads in a hand-written rule.

#### Prior art (gap 1)

- CSS itself: `:focus-within` and `:has()` are exactly the relays; this is what the workaround uses.
- `@custom-selector` (CSS Extensions draft; the repo's reference copy of postcss-plugins has `postcss-custom-selectors`, README example `@custom-selector :--heading h1, h2, h3;`) names a selector once for the whole stylesheet. It is global, so it cannot say "for this component only" and does not solve the problem; it is the same one-spelling-per-document model.
- Utility-class systems such as Tailwind (`focus-within:`, `has-[:checked]:`, `group-*`, `peer-*`) and Panda CSS (conditions such as a focus-within condition beside a focus one) keep *several named conditions* and let the component pick one. From general knowledge, not verified in this repo.
- Style Dictionary, Tokens Studio and Theo do not generate state selectors at all, so there is no prior art for the block-writes-its-states half.

#### Options (gap 1)

1. **Smallest: a rule-scoped directive that says how a component joins state spellings.** Example shape: inside the rule, `@toghen states via ':has(> input{state})';`, where `{state}` is replaced with the document's spelling for each state. The block then writes `.tg-field:has(> input:focus-visible)`, `.tg-field:has(> input:is(:disabled, …))`. No new field in the document; the spelling stays in one place, only the shape of the join is the component's. Cost: parse the directive and find it from the block (the same walk-back that `@toghen mode` and `@toghen base` already use, lines 1858-1880 for the parsing of a scope); change the join in `stateRules` (line 1427) and in the stacking for `:t()` reads; make a nested `:t()` inside the same wrapper set a scope (the lines 1886-1900 filter); specs.md, reference.md, guide.md, tests with synthetic fixtures. Roughly one function's worth of code. Figma: nothing. A Figma variant pins the modifier's mode on the component root; how CSS joins the selector is invisible to it.
2. **Named alternative spellings in the document.** A context gets more than one spelling, `"contexts": { "visible": { "selector": ":focus-visible", "within": ":focus-within" } }`, and a rule or block picks one by name (`:t(focus=visible:within)`, or a scope directive for the block). Keeps every spelling where other tools can read them (the stated reason for putting spellings in the document, specs.md *Writing every context*). Cost: lib's `getContextSelector` grows a name argument and validation; a new document field; the same directive and join changes as option 1, plus the naming. Figma: ignores the field, unless the Figma adapter ever wants to label variants from it (it does not today).
3. **Relay from the document: a context says "when the element is a wrapper, the state is on its child".** A field in the document such as `"relay": "> :is(input, select, textarea)"`. Smallest author effort but it puts a component-shaped idea (wrapper, child) in the shared document, and not every component relays the same way. I would not choose it.

#### Recommendation (gap 1)

Do the document edit now (add `:checked` to the selection spelling) and build option 1. It is the smallest change that makes the block right again (no dead rules, no hand-written pair) and keeps the one-spelling-per-context rule intact. Option 2 only if a second kind of respelling appears that a join shape cannot express (for example `:focus-within` where no `:has()` is wanted). Also decide, while there, that a `:toghen()` inside the wrapper's relay sets a scope; as it stands it silently reads the rest value, which is the surprising part.

---

### 2. A group cannot mark a key as not a CSS property

> **Component model:** closed by nesting, option 1. The semantic edge sits one level down, at `tg.swatch.semantic.edge`, and the built sheet writes no `edge` declaration; option 2 was not built.


#### What happens now (gap 2)

- A group block writes one declaration per token one level down, the key spelled by `cssIdentifier` as the property (`group()`, lines 1678-1707; each entry has `check: true` at line 1703). In `block()` (lines 1380-1383) an entry with `check` whose property `isProperty()` (line 30, the `mdn-data` table) does not know is reported and still written.
- Probe, with `tg.swatch`:
  - `onUnresolved: 'throw'`: the build stops: `"toghen-plugin.tg.swatch.edge" is written as "edge", which is not a CSS property mdn-data knows. It is written anyway: the data may lag CSS.`
  - `onUnresolved: 'warn'`: the same message as a warning, and the output carries a junk declaration: `… background-color: var(--tg-swatch-background-color, transparent); edge: var(--tg-swatch-edge, #0000001f);`.
- The governing text: specs.md *A group as a block*: "A key that is not a known CSS property is reported, and written", and the rejected ideas: "Writing only keys that look like properties", "A table from keys to properties in the document".
- Why the key is in the group: `tg.swatch.borderColor` is `{tg.swatch.edge}` and the semantic `edge` colour is defined per theme, in the theme files under `tg.swatch` (`toghen-ui/tokens/theme.light.tokens.json` line ~259). Everywhere else in toghen-ui the semantic tier sits in its own group (`tg.hue.text`, `tg.hue.saturation`), so `swatch` is the one place where the two meet.

#### Missing, bug, or already possible? (gap 2)

Already possible by naming, and missing as a feature.

- The spec states the rule: a subgroup is a part read by its own path, never written (specs.md *A group as a block*, "Subgroups are not written"; the Figma binding reads one level down the same way, `toghen-figma/specs.md` *Bindings from a CSS-keyed group*). So `edge` can sit one level down, for example `tg.swatch.palette.edge` (theme files change, base reference changes, no code). `declare` and `contexts` still write `--tg-swatch-palette-edge`, because they walk all token paths.
- Or move it to the existing semantic group that already holds edges, `tg.line` (for example `tg.line.swatch`).
- What is truly missing is a way to say it where the token is, so that the semantic tier and the CSS tier can share a group when the author wants them to.

#### Prior art (gap 2)

- Style Dictionary decides per token with `attributes`, `filter` and `transforms`; a token is kept out of a platform's output with a `filter` function or a custom attribute. The repo's reference copy of `postcss-design-tokens` (README) has nothing of the kind: it reads only named tokens. A token-level flag that outputs read is the usual shape (general knowledge for Style Dictionary).
- W3C DTCG gives `$extensions` for exactly this kind of vendor hint (the repo already uses `$extensions["com.toghen"].css` on modifiers).
- CSS itself: custom properties (`--name`) pass the existing check (line 31). A key `--edge` would write `--edge: …`, a real declaration; usable but it is a different thing from "not written".

#### Options (gap 2)

1. **Smallest, no code: nest it, and say so in the guide.** One sentence in the group section: "A token that is not a property of the component lives in a subgroup or another group." Cost: theme and base token edits in toghen-ui; a guide paragraph.
2. **A mark on the token.** `$extensions["com.toghen"].css`: `{ "property": false }` on `edge`. `group()` skips a token carrying it, with nothing reported. `declare` and `contexts` still write it (it is referenced by `border-color` and must exist as a property). The mark travels with the token on a rename, which a list in the group would not. Cost: `group()` reads the token's extensions (lib already merges `$extensions` as it does `$value`; toghen-lib/specs.md *Built, and stated in the reference*); about ten lines; one reference paragraph and one specs paragraph; tests with a synthetic group in the structured shapes. Figma: variable sync is untouched (the variable must exist, `borderColor` aliases it). The bind-from-group step already skips a key it has no row for into the run notes (specs.md *Bindings from a CSS-keyed group*, "Skipped, into the notes"); with the mark it could skip it silently. Optional, one line.
3. **A per-use exclusion in the directive**: `@toghen path except edge;`. New syntax, and it repeats at every use of the group, so it drifts. Reject.

#### Recommendation (gap 2)

Do option 1 now (it is free and the spec already says it) and option 2 only if a second system wants one group to hold both tiers. Note that the build-time cost of waiting is only that the semantic tier cannot be named after the component; there is no output defect. If the lead prefers the capability: option 2, leaving `declare` unchanged.

---

### 3. A colour built from a data value plus tokens

> **Component model:** not changed. `monogram.css` still composes its fill in the rule, from two `toghen()` reads of the saturation and lightness tokens, and no token holds the recipe.


#### What happens now (gap 3)

- Colours are always written as hex. `valueToCss` for `{colorSpace, components}` calls `colorToHex` (lines 109-111, 242-250), which converts to sRGB. A colour in `hsl` is written as a hex of one fixed hue. I checked `none`: an hsl colour with a hue of `none` is written as `#9e2e2e`, so `none` is treated as 0 degrees, silently. The W3C colour text in `.reference/w3c-token-format/w3c-colors.md` (lines ~149-155) says `none` means "missing" and differs from 0 when mixing. Nothing in the plugin carries it.
- The current workaround is `monogram.css`: `hsl(var(--hue, 210) calc(toghen(…saturation) * 1%) calc(toghen(…lightness) * 1%))`. Output (probe): `hsl(var(--hue, 210) calc(var(--hue-saturation, 55) * 1%) calc(var(--hue-lightness, 40) * 1%))`. That reads each token as a property at the element, so the cascade and the theme still reach it. The `* 1%` is needed because `var(--x)%` would be two separate tokens after substitution (a number and a stray `%`), and lib's dimension handler refuses `%` (`toghen-lib/src/handlers/dimension-handler.ts`: units px, rem, pt, mm only).

#### Missing, bug, or already possible? (gap 3)

The result is already possible and is what the file does. What is missing is a place in the *document* for the recipe. I tried the obvious step, a `string` token holding the recipe with references in it:

```
fill: { $type: 'string', $value: 'hsl(var(--hue, 210) calc({hue.saturation} * 1%) calc({hue.lightness} * 1%))' }
```

Lib interpolates it and the plugin writes it (probe): `.m { background-color: hsl(var(--hue, 210) calc(55 * 1%) calc(40 * 1%)) }`. But under `tokenLayer` with `declare` the property is `--monogram-fill: hsl(var(--hue, 210) calc(var(--hue-saturation) * 1%) …)` on the root, and a read is `var(--monogram-fill, …)`. A `var()` in a custom property is substituted on the element where the property is declared (specs.md, *Declaring a context*, the `.panel.dark button` example). So `--hue` would be read on the root, not on the monogram, and every monogram would show the fallback hue 210. By that same CSS rule the idea fails; I did not run a browser. `as value` fixes the element but bakes in the default context (`calc(55 * 1%)`), losing the theme. So today the recipe cannot be a token, which is exactly what the comment in `monogram.css` says.

#### Prior art (gap 3)

- Open Props and similar CSS-first systems keep a hue (or an `-hsl` channel triple) as a property and compose `hsl(var(--hue) var(--sat) var(--light))` in the component rule, which is what the file does (general knowledge, not in the repo).
- Browsers can compute a colour from a data colour at the element: relative colour syntax `hsl(from var(--seed) h s l)` and `color-mix(in oklch, var(--a), var(--b) 20%)`. The repo's reference copies of the polyfills (`postcss-relative-color-syntax`, `postcss-color-mix-function`) say they cannot resolve `var()` arguments at build time, so the work has to stay in the browser. Both are CSS Color 5; browser support is wide in 2026 by my knowledge, not checked here.
- Tokens Studio colour modifiers (lighten, mix, alpha) and Style Dictionary colour transforms resolve a derived colour at build time to one fixed value. They have no runtime data input. Theo is the same (value transforms). General knowledge.
- W3C colour module in the repo: components may be a number or `none`; a `hex` fallback is part of the value. The module has no derived or computed colour.

#### Options (gap 3)

1. **Smallest: change nothing in the code; keep the read in the rule and write it down as the pattern.** A guide paragraph: "a colour from data and tokens is composed in the rule from tokens read as properties; use `calc(toghen(x) * 1%)` for percentages". Cost: documentation. The monogram already is this. Figma: the monogram's fill in Figma is a fixed colour in the component file, since a data hue has no Figma meaning.
2. **A read that expands a recipe at the element: form `inline`.** Allow a `string` token holding a CSS recipe, and a form `toghen(path as inline)` that writes the token's text with every reference as its own property read, `var(--hue-saturation, 55)`, and never as the recipe's own property; `declare` skips a token marked `$extensions["com.toghen"].css: { "declare": false }` (or declares nothing for a form-only token). Cost: a form (the forms list at line 55, the form handling in `read`), the skip in declare/contexts, spec + reference + guide, tests. Figma: the token is a string with no Figma use; the adapter already skips and reports what it cannot hold (specs.md *Values Figma cannot hold as written*), so it would be reported as skipped, or ignored through the same mark.
3. **Open colour channels in a colour token.** The colour is `{ colorSpace: 'hsl', components: ['none', 55, 40] }` per theme and the plugin writes it in its own space with each `none` replaced by a named property read (`hsl(var(--hue, 210) 55% 40%)`), in the component rule. It puts the saturation and lightness back in the colour token where a designer expects them, and Figma gets a real colour (the `hex` fallback holds a placeholder hue). Cost: largest. The plugin stops writing only hex for such tokens, picks a channel name from somewhere (an `$extensions["com.toghen"].css.channels` field or a form argument), and must read inline for the same reason as option 2 (option 3 contains option 2). It also needs the lib to stop turning `none` into 0.

#### Recommendation (gap 3)

Option 1 now. One case is not enough to design a form, and CLAUDE.md asks for generic or not at all. If a second case appears (a tint from a data colour, a chart series from an index), build option 2 first. Option 3 is the right long-term shape for colours with open channels but only after option 2, and only with a decision on `none` in lib. Record separately, as a plain defect: a `none` component is silently written as 0.

---

### 4. `@toghen <typography-token>;` always writes longhands, even under `typography: 'font'`

> **Component model:** the form is gone. The bare `@toghen path;` directive and `as shorthand` are retired, and a typography token now has its own mixin of longhands, so no beside member is dropped. Option 2 was not built: under `typography: 'font'` the mixin still writes longhands.


#### What happens now (gap 4)

Confirmed, by code and by probe.

- `entriesOf` (line 1614): with no form, a typography token reaches the last branch (lines 1663-1675) and returns one entry per member of its value, each at its own property (`cssIdentifier(name)`), whatever the `typography` option says. The option is consulted only for `toghen(path)` as a value (`spellAs`, line 757), for declare (`declarable`, line 737), and for a typography *key of a group* (line 1698, which writes `font` and then the members the shorthand cannot carry).
- Probe, options as toghen-ui builds them (`typography: 'font'`, `tokenLayer`, `references: 'var'`), `@toghen toghen-plugin.tg.text.label;`:

  `font-family: var(--tg-font-ui); font-size: var(--tg-fs-1); font-weight: 600; line-height: var(--tg-lh-normal); letter-spacing: var(--tg-text-label-letter-spacing, 0.06em); text-transform: var(--tg-text-label-text-transform, uppercase);`

  That is also what is in `dist/toghen-ui.css` for `[data-text='label']`. Note the first four are plain reads of references with no fallback: under `'font'` the members the shorthand carries have no property of their own (`declaredMembers`, line 984, gives only the beside members), so a change made to `tg.text.label` itself would not reach them.
- The same call as a group key (`tg.monogram.font` is `{tg.text.small-strong}`, inside `@toghen toghen-plugin.tg.monogram;`) gives `font: var(--tg-monogram-font, 600 10px/1.4 Geist, …)`.
- `@toghen toghen-plugin.tg.text.label as shorthand;` gives (probe) `font: var(--tg-text-label, 600 10px/1.4 Geist, -apple-system, system-ui, sans-serif);` and **nothing else**: the label's `letter-spacing` and `text-transform` are dropped without a word. The group form, and `declare`, write them beside `font`.

#### Is it a bug or the specified behaviour?

The longhands are the specified behaviour; the silent loss under `as shorthand` is a defect of consistency.

- Governing passages: specs.md *How a query is printed*: "`@toghen path;` with no form keeps today's behaviour: a typography block expands to longhands, a composite value is refused." reference.md *`@toghen` — a block as declarations*: "Without a form, only a block expands… With `as longhands` or `as shorthand` a composite with longhands expands too". guide.md *A block: `@toghen path;`*: "one longhand per member". reference.md *`typography`*, the `'block'` bullet says `@toghen path;` writes longhands; the `'font'` bullet names only `toghen(ds.text.body)`; it says nothing about `@toghen`. specs.md *A group as a block* even offers `@toghen ds.button.font;` as "the fix for the longhands" under `'block'`.
- No test pins a bare typography token under `'font'` (grep over `test/`: the `typography: 'font'` runs are declare, group and `as shorthand` cases), so nothing says the behaviour is deliberate either way.
- The form that exists, `@toghen path as shorthand;`, is documented as one declaration (reference.md *`as`*: "a typography token at `font`"). specs.md *Typography is not affected* states the principle for declare ("they are the properties the shorthand cannot carry, and dropping them loses them"), and the group form follows it (*A typography key under `'font'` writes what the shorthand cannot carry beside it*). Only `as shorthand` on a block does not. I checked `forms.test.ts:128-143`: those tests use a body token that has no beside members (output is a single `font:`), so no test sees the loss. I did not confirm that by reading the fixture's member list; I read the output.

#### Prior art (gap 4)

Nothing found in this repo's reference material. Style Dictionary offers both forms as separate transforms or a `expand` option (specs.md *How a query is printed* cites it for composites); a `font` shorthand resets the other font sub-properties (style, variant, stretch), a CSS rule worth stating in the doc whichever option is chosen.

#### Options (gap 4)

1. **Smallest: fix `as shorthand` on a typography token to write what the group writes** (the `font` shorthand, then the members it cannot carry, each at its own property and read as its own property). Cost: in `entriesOf` the shorthand branch (lines 1642-1647) returns the `font` entry plus the beside entries already built for the group at lines 1698-1704; a test; one reference paragraph. Then toghen-ui writes `@toghen toghen-plugin.tg.text.label as shorthand;`. No behaviour change for any bare use.
2. **Let the option decide the bare form too.** Under `'font'`, `@toghen typographyToken;` writes the shorthand and the beside members; `as longhands` keeps the old output. One rule for the three ways of writing a typography token (value, group key, block). Cost: option 1's code plus a change of the bare branch (line 1663 onwards) and a changelog note: a consumer using `'font'` and a bare token gets `font:` instead of longhands. Visual risk: the shorthand resets font-style, variant and stretch, which a rule written for longhands may not have wanted. Docs: guide.md (*A block*), reference.md (both the `@toghen` section and the `typography` option), specs.md (the sentence quoted above). Figma: none; a Figma text style is the whole token either way.
3. **Document it and leave it.** Add to the guide that a bare block under `'font'` is longhands and that `as shorthand` drops the beside members. Not recommended: it documents a loss.

#### Recommendation (gap 4)

Option 1 first, as the defect fix (it removes a silent loss and changes no existing output). Then option 2, since the option exists precisely to let a system choose once; a system that chose `'font'` and a bare `@toghen` that ignores the choice is a surprise that costs the user in the same way toghen-ui met. Ship option 2 with a changelog line and keep `as longhands` as the way back. Add the test with a label-like token (letter spacing and text transform) in the structured shapes.

---

### 5. No combined states across modifiers

> **Component model:** not solved by design. A selected boxed checkbox keeps its tint under hover only because its selected rule, `:has(> input:checked)`, is more specific than `:hover`; a browser on a synthetic page confirmed it. The model's answer for a pair that needs its own look is a nested part (the pattern is `tg.button.primary.hover`), which no component uses for selected and hover yet.


#### What happens now (gap 5)

- The resolver merges contexts in `resolutionOrder`; a property set by two modifiers takes the later modifier's value whole. For element states the plugin writes one sibling rule per state, in resolution order, so with two matching "the later one wins as it does in the resolver" (specs.md *Element states*). The same section ends: "A pair that needs its own value is not designed."
- Probe, a synthetic row with `selection=on` (`[aria-selected='true']`) and `pointer=hover` (`:hover`), both setting `row.bg`, `tokenLayer` + `references: 'var'`: `.row { … var(--row-bg, #ffffff) } .row[aria-selected='true'] { --row-bg: #cce0ff } .row:hover { --row-bg: #eeeeee }`. A selected, hovered row shows the hover colour. toghen-ui meets this as `checkbox.boxed.backgroundColor`, defined by both selection (`tg.bg.selected`) and hover (`tg.bg.hover`) in `tokens/states/*.tokens.json`: the generated hover rule comes after the selected one (probe 1c output order), so selected loses its tint on hover.
- Lib's `resolveContextsToDesignSystem(combinations)` can build a named combination (`toghen-lib/src/resolver/resolver.ts` around line 330), but the combination's value is still the merge, so it carries no new value. The W3C Resolver has no conditional source (toghen-lib/specs.md *The sum and the product*: "Independence is the author's call").
- Figma's model is the sum too: one collection per modifier; a token that varies under two modifiers is a chain of aliases, head in the last link's collection (toghen-figma/specs.md *Variables per modifier: the sum*). Same result as CSS: hover wins over selected.

#### Missing, bug, or already possible? (gap 5)

Already possible two ways, neither named in the docs.

- **A third element-state modifier for the pair.** I ran it (probe, synthetic document): add a modifier `both` with contexts `no` (default) and `selectedHover`, `inherits: false`, spelled `:is([aria-selected='true']):hover`, ordered after `selection` and `pointer` in `resolutionOrder`, and giving the combined value. Output adds `.row:is([aria-selected='true']):hover { --row-bg: #b8d4ff; }` after the other two, for both the token-layer form and the `bind: 'chain'` form (the second form I ran with no token layer; I did not read the chain output closely). It works because the combined selector is more specific as well as later.
  - Cost on Figma: every element-state modifier becomes a variant axis (specs.md *Axes from the tokens*), so `both` is a third axis whose `selectedHover` is only meaningful with `selection=on` and `pointer=hover`. `include` and `exclude` can prune it, at the price of a few extra lines per component file. Not tried live.
- **Compose instead of replace** (what toghen-ui did): hover sets another property (an inset wash shadow, `tg.wash.hover`) that paints over the selection colour. `color-mix(in srgb, var(--row-bg), var(--wash))` in the component does the same for a background colour, from two tokens each set by its own state.

#### Prior art (gap 5)

- Material's "state layers" model: hover, focus and pressed are overlays of an opacity over the container colour, not replacement colours; so they combine with selected by composition (general knowledge, not in the repo).
- Tailwind-style stacked variants (`aria-selected:hover:bg-…`) write the combination as its own rule with its own value, which is the same thing as the third-modifier pattern. General knowledge.
- CSS `color-mix()` and relative colour syntax compute from the colour underneath at the element; as in gap 3, the repo's polyfill READMEs say they cannot resolve `var()` at build time, so it must stay in the browser.
- Tokens Studio has colour modifiers applied at export; Style Dictionary has no states. Neither composes at runtime.

#### Options (gap 5)

1. **Smallest: write the pattern down, build nothing.** specs.md *Element states* gets one sentence replacing "not designed": a pair that needs its own value is a modifier of its own, ordered after both, spelled as the compound; guide.md gets an example next to the wash alternative. Cost: docs. Figma: as above, three axes with `include`.
2. **Combination sources in the resolver document.** A document field (an extension, since the W3C Resolver has none), for example `"$extensions": { "com.toghen": { "combinations": [ { "when": { "selection": "on", "pointer": "hover" }, "sources": [ … ] } ] } }`, merged last when those contexts are all chosen. Lib builds the combined mode; postcss writes the rule with the two spellings joined as a compound (the machinery for `:t(selection=on, pointer=hover)` exists) and Figma gets a per-combination value to hold. Cost: lib resolver semantics, a document format that other tools do not know, `contextsOf` and the chain model must account for a cell that is neither link, Figma needs a mode per combination or a skip. Large, and it breaks "the sum, not the product" (the whole point of the Figma redesign).
3. **A token whose value is derived from the value underneath** ("the earlier modifier's value, mixed with this"). In CSS a `color-mix()` of the previous link in a chain; in Figma no equivalent that I know of (variables hold no colour expressions as far as I know; verify before relying on it). Needs a computed-value type that DTCG does not have. Reject for now.

#### Recommendation (gap 5)

Option 1: document the third-modifier pattern, and the wash as the preferred alternative where it fits (it keeps one axis per behaviour and needs no pruning). Keep option 2 out until a system needs more than a few combined cells, because it breaks the sum model that both adapters are built on. In toghen-ui, the checkbox could use the third-modifier pattern or the wash pattern the row already uses; that is a choice for the owner of the design system, not a Toghen change.

---

### Side findings (not asked, worth knowing)

- A `none` colour component is silently written as 0 (gap 3).
- Under the default `onUnresolved: 'warn'`, a non-property group key (gap 2) is reported and its junk declaration (`edge: …`) is written into the stylesheet; only `throw` stops the build.
- The generated state rules for wrapper components are dead CSS (gap 1).
- Probes ran against `toghen-postcss/dist/index.js`, not the source; if `dist` is stale relative to `src` the outputs may differ slightly. Modification times say dist is newer.


### Later the same day: the row met the first gap twice

Building the row as a disclosure (`toghen-ui/specs.md`, *After the migration*) moved the open state and the focus onto the summary button inside the row, while the look stays on the row. That is the first gap again, a state carried by a child: the open and focus rules are written by hand in `@layer tg.states` with `@toghen mode` pins (`row.css`, marked `TOGHEN GAP:`), and the rules the block generates on the host (`tg-row[aria-expanded='true']`, its `:focus-visible`) are dead. One more finding: pinning a read to its rest value wrote a custom property that refers to itself, so the hover reset reads the token directly. The relay directive proposed for the first gap would cover the row too; the self-reference is a defect to check in the pin.

## Roadmap (each step ruled before it is built)

> **Status:** steps 1 to 3 are built: the eighteen components are in this package, and the plugin's stylesheet holds the application only. Steps 4 and 5 are not built: the package has no component files or sheets.

1. Move the tokens here and retire `toghen-demo` (this step).
2. A component tier keyed by CSS property, and an element-state modifier (`hover`, `pressed`, `disabled`, `focus`), from an inventory of the screen's components.
3. The plugin's stylesheet moves, component by component, to `@toghen` blocks with generated states.
4. A component file per component, synced into a Figma file through the plugin.
5. Sheets documenting the components.

## Design reflection: a small, production-ready design system

> **Status: proposed, 11 October 2026, nothing ruled.** Written from the inventory of the plugin's screen (31 components) to plan the design system the plugin will consume. Each decision below is walked and ruled one at a time; until then it is a proposal.

> **Status:** the component set is built, eighteen components. The principles are restated in [specs.md](./specs.md); the questions below are kept as the reflection left them.

### What "production-ready" and "simple" mean here

The design system is **vanilla**: custom elements with no framework, CSS written through `@toghen/postcss` from the tokens, and the tokens themselves. Its one consumer is the plugin, but it is built as if it had others: every component has a documented contract, and nothing the plugin does by convention is left to convention.

*Production-ready* means, per component: a contract (anatomy, attributes, states, tokens, events), complete states wherever it is interactive (hover, pressed, focus, disabled), an accessibility pattern taken from the WAI-ARIA Authoring Practices, both themes, reduced motion respected, and a Figma counterpart built from a component file.

*Simple* means the smallest set that builds the plugin's screen. The inventory finds 31 things styled; many are the same idea spelled twice (three "selected" spellings, two drop targets, seven row recipes, two control surfaces). A design system is where those are said once.

### What the screen teaches

- **States are thin.** Hover on 8 rules, no pressed anywhere, disabled on buttons only, one global focus ring that the search box removes. Most of the state vocabulary is new, not extracted.
- **One idea, several spellings.** Selected as `aria-selected`, `aria-pressed`, `aria-checked` and `.selected`; tone as an attribute, a class suffix and a utility class; a toned left gutter in five components with the same 2 px border and 10 px padding.
- **Rows are the signature.** Item, property row, template row, recent row, result row, source row, command row: one anatomy (leading mark, label, value, trailing action) at nine different heights (22 to 44 px).
- **Literals off the scale.** `6px` is written 22 times beside a 4-8-12 spacing scale; 26 px is written four times where `h-ctl` holds it.
- **Script carries what CSS should.** A disabled primary button works because script drops the `primary` class; `aria-expanded` is set and never styled while a class does its job.

### Principles (ruled 11 October 2026)

1. **Light DOM, no shadow root.** *(Ruled 11 October 2026.)* Toghen's whole CSS story is the cascade: a token layer that declares, components that read, generated state rules, a state layer after the components. A shadow root would cut every component off from it and push styling through `::part` and custom properties one by one. The plugin is one page with one stylesheet and nothing to be protected from. Prior art on this side: GitHub's Catalyst, and the "HTML web components" practice of enhancing markup that already works. On the other side, Shoelace and Web Awesome use shadow roots, for libraries dropped into pages they do not control, which this is not.
2. **A custom element only where script is needed.** *(Ruled 11 October 2026, with icons as an icon font, below.)* A button, a text input, a select and a checkbox are native elements with a class (`<button class="tg-button">`): their keyboard, focus, form and accessibility behaviour is the platform's, for free. A custom element is used where a component needs script: the dot's spoken label, tabs and a segmented control with arrow keys, the popover, a row that opens.
3. **One spelling for variants: `data-*` attributes.** *(Ruled 11 October 2026.)* `data-variant="primary"`, `data-size="sm"`, `data-tone="warn"`, on a native element or a custom one alike, so every component reads the same and the HTML stays valid. Never a modifier class.
4. **States come from the platform and ARIA, never from classes.** *(Ruled 11 October 2026.)* `:hover`, `:active`, `:focus-visible`, `:disabled`, and `aria-selected`, `aria-pressed`, `aria-checked`, `aria-expanded`, `aria-disabled`, `aria-invalid`. Script sets ARIA; the stylesheet reads it; one attribute is both the meaning and the look.
5. **Three token tiers.** *(Ruled 11 October 2026.)* Primitives (the scales and the palette), semantic (`tg.bg`, `tg.text`, `tg.status`, what exists today), and a component tier keyed by CSS property (`tg.button.backgroundColor`), whose values reference the semantic tier. A variant is a subgroup (`tg.button.primary`), read by its own block in its own rule. States are element-state modifiers of the document. No component token holds a literal the semantic tier could hold.
6. **One vocabulary in code and in Figma.** *(Ruled 11 October 2026.)* A component's `data-variant` values are its Figma variant property's values, its element states are the axes its component file takes from the tokens, and its parts are the layers. Nothing is mapped by a table: the names are the same.
7. **Text styles are tokens.** *(Ruled 11 October 2026.)* The recipes the screen repeats (the uppercase label at `0.06em`, the code face at the working size, the title) become typography tokens, so they are text styles in Figma too, and the `.mono`, `.muted` utilities become text roles.

### The component set (ruled 11 October 2026)

Seventeen components in the design system; the rest stays in the plugin, composed from them.

| Component | Element | Variants and states | Replaces |
|---|---|---|---|
| **icon** | `<i class="tg-icon ph ph-<name>" aria-hidden="true">`, the [Phosphor](https://phosphoricons.com/) icon font | `data-tone` (default, muted, faint), `data-size` | `tg-glyph`, `.icon`, the hand-drawn SVGs in `glyphs.js` and `icons.js`, nine parent rules that colour icons |
| **dot** | `<tg-dot>` | `data-state` (drifted, upstream, absent, unread, connected, busy, idle, error) | `tg-dot`, `.dot-idle` |
| **swatch** | `<span class="tg-swatch">` | `data-size` (sm, md, lg), empty; fill from data | `.swatch` |
| **monogram** | `<span class="tg-monogram">` | `data-size`; hue from data, lightness per theme as tokens | `.monogram` and its one theme-specific rule |
| **divider** | `<hr class="tg-divider">` | — | `.divider` and ~25 hand-written hairlines where a border is not a part |
| **button** | `<button class="tg-button">` | `data-variant` (default, primary, quiet, link), `data-size` (md, sm, xs), icon-only; hover, pressed, focus, disabled | `.btn`, `.btn.*`, `.icon-btn`, `.link`, three context overrides |
| **field** | `<label class="tg-field">` around an `<input>` | leading icon, `data-variant="code"`; focus within, disabled, invalid | `.field`, `.search` (whose focus ring is lost today) |
| **select** | `<select class="tg-select">` | `data-size`; focus, disabled | `.select` |
| **checkbox** | `<label class="tg-checkbox">` | `data-variant` (plain, boxed); checked, focus, disabled | `.check`, `.chip-check`, the checkbox in `.allow-breaking` |
| **chip** | `<tg-chip>` | `data-tone`, `data-size`, `data-variant="code"`; as a toggle: pressed, hover, focus | `tg-chip` |
| **segmented** | `<tg-segmented>` | selected, hover, focus; arrow keys | `.segmented` |
| **tabs** | `<tg-tabs>` | selected, hover, focus, disabled; arrow keys | `tg-tabs` |
| **callout** | `<tg-callout>` | `data-tone` (info, warn, err), `data-size` (md, sm); its mark chosen by tone inside the element | `tg-callout`, the mark chosen in `callout()` |
| **card** | `<tg-card>` | with a label above it | `tg-card`, `.group`, `.label` |
| **dropzone** | `<button class="tg-dropzone">` | `data-size` (md, sm); drag-over (`aria-dropeffect` or a state set by script) | `.drop`, `.add-chip` |
| **row** | `<tg-row>` | parts leading, label, value, trailing, detail; `data-density` (dense, regular, roomy); `data-tone` for the gutter; hover, selected, expanded | `.item`, `.prop`, `.tpl-row`, `.recent`, `.result-row` line, `.source-row`, `.command-row` |
| **table** | `<table class="tg-table">` | `data-density` | `table.modes`, `.ctable`, `.edges` (a two-column table, or a `<dl>`) |

**Stays in the plugin**, built from these: the panes and their headers, the token browser (its columns, bands and spines), the token detail, the result surface, the status bar, the identity card, the popover's content. They are the application, not the design system.

### Questions the reflection raises

- **The icon font's cost** (*icons ruled 11 October 2026: Phosphor, as a font*). The plugin's window has no network, so the font is embedded, as Geist is. Phosphor's regular weight carries every icon, more than a thousand, and the repository has no font tool to cut it to the ones used; its size against the window's budget is not measured yet. In Figma, an icon is then a text layer in the Phosphor face holding the icon's character, so the face must be available to Figma where the file is opened (installed, or shared by the organisation). Both are to be checked before the icon component is built.
- **The popover.** The platform now has a `popover` attribute and anchor positioning, which would replace the plugin's fixed positioning and its width written in two places. Whether Figma's desktop window supports both has to be measured before it is chosen.
- **The row's densities.** Nine heights become three. Which three, and which row takes which, changes the screen; the rule that visual changes are allowed covers it, the UX rulebook still binds what each row is for.
- **Testing.** The screen has no test runner, only the preview page. A design system's custom elements have behaviour (keys, labels, opening) that a test should hold. A small DOM for `node:test` is one more development dependency; checking in the preview with the browser is none.
- **Distribution.** The package would export its elements (`elements.js`, ES modules, no build), its stylesheet (built by `@toghen/postcss` from its tokens and component CSS), and its tokens. The plugin's build bundles the first two, as it bundles its own code today.
- **Naming.** One prefix, `tg-`, for elements, classes and tokens, as the plugin uses today.

### How it would be built (once ruled)

1. Rulings, one at a time: the principles, then the set, then the open questions.
2. The token tiers: the semantic tier tidied (the off-scale literals, the unused tokens, the duplicate 22 px), the five element-state modifiers, typography tokens, then the component tier, component by component.
3. Components, smallest first (icon, dot, swatch, divider, then button, field, select, checkbox, then chip, segmented, tabs, callout, card, dropzone, then row and table), each with its contract in `reference.md`, its CSS through `@t` blocks, its element where it has one, and the plugin's screen moved onto it.
4. A component file per component, synced into a Figma file through the plugin.
5. Sheets: a page per component, documenting it from the same files.

## Build plan (ruled 11 October 2026, *to build*)

> **Status:** built on 13 October 2026, with the component model. Where it names element-state modifiers, the state layer and the layer options, the build replaced them with parts, mixins and native nesting; see [specs.md](./specs.md).

The open questions above take these defaults, so the build can proceed; each can be revisited once the screen is in front of us.

### Package layout and exports

```
toghen-ui/
├── tokens/            resolver document and token files (tiers below)
├── src/
│   ├── tokens.css     @toghen contexts for the token layer
│   ├── components/    one .css per component, written with @toghen blocks; one .js per custom element
│   ├── elements.js    imports and defines every custom element
│   └── index.css      imports every component stylesheet in order, inside the layers
├── dev/gallery.html   every component, every variant and state, in both themes: the playground's page
├── scripts/build.mjs  writes dist/toghen-ui.css through @toghen/postcss
└── dist/              built, not committed
```

- **Exports:** `@toghen/ui/resolver.json` and `@toghen/ui/tokens/*` (as now), `@toghen/ui/elements.js` (ES module source, no build), `@toghen/ui/styles.css` (the built `dist/toghen-ui.css`), and the Phosphor font as embedded by the build.
- **Layers:** `@layer tg.tokens, tg.base, tg.components, tg.states;` with `tokenLayer: 'tg.tokens'` and `stateLayer: 'tg.states'`. The plugin's own rules come after, unlayered or in a later layer, so they can adjust a component when they must.
- **The build** loads the resolver document with `load`, resolves it with `resolveContextsToDesignSystem()`, and runs `src/index.css` through `@toghen/postcss` with `onUnresolved: 'throw'`, `references: 'var'`, `typography: 'font'`, `tokenLayer`, `stateLayer`. The fonts (Geist and Phosphor's regular weight) are embedded as data URIs, as the plugin does today; the build moves here from `toghen-figma/build.mjs`.
- **The plugin** imports `@toghen/ui/elements.js` into its bundle and puts `@toghen/ui/styles.css` before its own stylesheet in `ui.html`.

### Token tiers

- **Primitives and semantic**, the existing groups under `tg`, tidied: the off-scale `6px` gets a step (`tg.sp.1-5`, 6 px) rather than 22 literals; `26px` written as a literal reads `tg.h.ctl`; the unused `tg.sp.5` and `tg.r.pill` stay only if a component uses them; `tg.h.row-dense` and `tg.h.ctl-sm` (both 22 px) keep both names, since they size different things.
- **Typography:** typography tokens for the recipes the screen repeats: `tg.text.body`, `tg.text.small` (the working 10 px size), `tg.text.label` (uppercase, `0.06em`), `tg.text.code`, `tg.text.title`, `tg.text.heading`.
- **Element states:** five element-state modifiers (`"inherits": false`), in this resolution order, the later winning where two apply:

  | Modifier | Contexts | Spelled as |
  |---|---|---|
  | `selection` | `off`, `on` | `:is([aria-selected='true'], [aria-pressed='true'], [aria-checked='true'], :checked)` |
  | `disclosure` | `closed`, `open` | `[aria-expanded='true']` |
  | `pointer` | `rest`, `hover`, `pressed` | `:hover`, `:active` |
  | `focus` | `none`, `visible` | `:focus-visible` (a field: its input's, through `@toghen states via`) |
  | `availability` | `enabled`, `disabled` | `:is(:disabled, [aria-disabled='true'])` |

  Selection and disclosure say what an element is; pointer and focus what happens to it; disabled comes last, so a disabled control does not answer the pointer.
- **Component tier:** `tg.<component>` groups keyed by CSS property (`tg.button.backgroundColor`), each value a reference to the semantic tier; a variant is a subgroup (`tg.button.primary`) holding only what it changes; states are the five modifiers' contexts on those tokens.

### Components

The seventeen of the table above, each with: its stylesheet (`@toghen tg.<component>;` in its rule, variants by `[data-variant]` rules reading their subgroup), its custom element where the table names one, its states from the modifiers, and a section in the gallery. Defaults for the open questions:

- **Row densities:** `dense` 22 px (result rows), `regular` 28 px (items, properties, table rows), `roomy` 36 px (source, command and template rows); a row with two lines of text (recents) takes `roomy` as a minimum height.
- **The popover:** keeps the plugin's fixed positioning until native `popover` and anchor positioning are measured in Figma's window; it is not a design-system component in this build.
- **Testing:** the custom elements' behaviour that can be tested without a DOM (labels chosen, keys mapped) is tested with `node:test` on plain functions; the rest is checked in the gallery and the plugin's preview with a browser. No DOM dependency is added.
- **Icons:** `@phosphor-icons/web`, regular weight, as a font; every hand-drawn glyph is replaced by its nearest Phosphor icon, and the mapping is listed in the gallery.

### Migration of the plugin

After the package builds and its gallery shows every component, the plugin's markup moves onto it: `.btn` becomes `tg-button` with `data-*`, `.selected` becomes `aria-selected`, `.open` becomes `aria-expanded`, the seven row recipes become `tg-row`, and `ui/styles.css` keeps only the application's layout and the parts that stay in the plugin. Visual changes are allowed; the UX rulebook binds placement and wording.

## After the migration (ruled 11 October 2026, *to build*)

> **Status:** items 3, 4 and 5 are built (`tg-list`, the row's summary button, the flush card body). Items 1 and 2 are the build's behaviour.

The plugin's move onto the design system raised five questions; the owner ruled them.

1. **A disabled primary button is a visible disabled primary.** Kept: disabled is a state, not a missing class.
2. **A row's leading mark comes first,** before its label, as the anatomy says, also where the screen had it after the name. Kept for now.
3. **Selection is valid ARIA: `tg-list`.** `aria-selected` is not allowed on a button, and the token browser's rows were buttons. A list of rows from which one is chosen is the WAI-ARIA *listbox* pattern, so the design system gains `<tg-list>`: the listbox, holding `tg-row`s that are its options (`role="option"`, `aria-selected`). It keeps one tab stop (roving `tabindex`, as `tg-tabs` and `tg-segmented` do through `choice.js`), moves with the arrow keys, Home and End, selects on click and on Space, and dispatches `tg-change`; Enter on an option is its activation (`tg-activate`), for a row that opens something elsewhere, as a token browser's folder opens the next column. Selection follows focus only when the list says so (`data-selection="follows-focus"`). The token browser's columns become `tg-list`s. The component set is eighteen.
4. **A row with a detail is a disclosure, not a button.** A row whose detail holds controls cannot itself be a button: a button's content is flattened for a screen reader, and controls inside it are lost. The row's anatomy becomes, following the WAI-ARIA *disclosure* pattern: a **summary** part, a `<button>` the element provides, holding the leading mark, the label and the value, with `aria-expanded` and `aria-controls`; the **trailing** part, outside the button, where actions (a Forget button) may live; and the **detail**, a region the summary controls. The host `tg-row` takes no role. A row with no detail and no actions is still plain content, and a row that is an option is the case above. The plugin's in-place token detail and template detail, and the recent row's Forget, then live inside their row, and the plugin's workarounds for them go.
5. **A row inside a card is flush.** A card insets its content; a row insets its own parts and draws its own separators; together they inset twice, and the plugin zeroed it by hand. The design system says it once: a card whose body holds rows (`:has(> tg-row)`, `:has(> tg-list)`) gives its body no inline padding, so the rows run edge to edge and their own padding lines up with the card's label. No attribute: the composition decides, as a list inside a card does in most design systems.

## Moved: a repository of its own, numbered from 0.1.0 (25 October 2026)

**Status:** done.

**The change.** The package left the Toghen monorepo for its own repository, [`Toghen/ui`](https://codeberg.org/Toghen/ui) on Codeberg, in one first commit. Its history before the split is not carried over. Its version starts again at 0.1.0; the last version before the split was 0.3.2. Links that crossed into other packages now point at their repositories.

**Why.** Ruled by Egildo on 25 October 2026: one repository per package, and a [house](https://codeberg.org/Toghen/house) repository for what they share (the constitution, the speckit preset, the Biome config, the purity check). The plan is in house, `.reference/plans/workspace/plan-2026-10-25-tooling-codeberg.md`.

**With it.** Biome lints and formats the code, `pnpm check` runs every gate, and speckit with the house preset runs the rounds. The package is published on npm for the first time, since `@toghen/figma`, in its own repository, can no longer reach this folder.
