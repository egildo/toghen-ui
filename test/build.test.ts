import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { buildCss, FONTS } from '../scripts/build.mjs';
import { PHOSPHOR_NAMES } from '../src/icons.js';
import { COMPONENTS } from './components.ts';

let css = '';

/** A match, asserted without printing a 400 KB stylesheet when it fails. */
const has = (pattern: RegExp, within?: string) => assert.ok(pattern.test(within ?? text), `expected the stylesheet to match ${pattern}`);
const lacks = (pattern: RegExp, within: string) => assert.ok(!pattern.test(within), `expected the stylesheet not to match ${pattern}`);

let root: postcss.Root;
/** The stylesheet without its font data, which is not text anyone reads. */
let text = '';

before(async () => {
  css = await buildCss();
  text = css.replace(/url\(data:[^)]+\)/g, 'url(DATA)');
  root = postcss.parse(text);
});

/** The names of the layers enclosing a node, outermost first. */
const layersOf = (node: postcss.Node): string[] => {
  const names: string[] = [];
  for (let parent = node.parent; parent && parent.type !== 'root'; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as postcss.AtRule).name === 'layer') names.unshift((parent as postcss.AtRule).params);
  }
  return names;
};

/** A nested rule's selector written out against the rules it nests in: `&:where(:hover)` in `.a` is `.a:where(:hover)`. */
const flat = (rule: postcss.Rule): string => {
  const parent = rule.parent?.type === 'rule' ? flat(rule.parent as postcss.Rule) : undefined;
  if (!parent) return rule.selector;
  return rule.selector.includes('&') ? rule.selector.replaceAll('&', parent) : `${parent} ${rule.selector}`;
};
const nested = (rule: postcss.Rule) => rule.parent?.type === 'rule';

test('the built stylesheet has no object, no unresolved query, no directive, no mixin left in it', () => {
  lacks(/\[object Object\]/, text);
  lacks(/toghen\(/, text);
  lacks(/@toghen/, text);
  lacks(/:toghen\(/, text);
  lacks(/@apply|@mixin|@contents/, text);
  lacks(/\bundefined\b|\bNaN\b/, text);
  // No unreplaced font placeholder, and each face is a data URI.
  lacks(/url\((GEIST_SANS|GEIST_MONO|PHOSPHOR)\)/, css);
  assert.equal([...css.matchAll(/url\(data:font\/woff2;base64,/g)].length, 3);
});

test('the layers are declared in the order the plan gives, and there is no state layer', () => {
  const first = root.first as postcss.AtRule;
  assert.equal(first.name, 'layer');
  assert.equal(first.params, 'tg.tokens, tg.base, tg.components');
  lacks(/tg\.states/, text.replace(first.params, ''));
});

test('the token layer declares the defaults and each theme; the base only reads; a component re-points only inside a part', () => {
  has(/:root\s*\{[^}]*--tg-bg-base: #f2f2f2/);
  has(/\.figma-dark, \[data-theme='dark'\]\s*\{[^}]*--tg-bg-base: #1f1f1f/);
  has(/\.figma-light, \[data-theme='light'\]\s*\{/);
  // A state or variant is not a context: nothing in the token layer is spelled by one.
  lacks(/--tg-[a-z-]+:[^;}]*;[^}]*\}\s*\[aria-expanded/, text);

  root.walkDecls(/^--tg-/, (decl) => {
    const layers = layersOf(decl);
    const rule = decl.parent as postcss.Rule;
    const inTokens = layers[0] === 'tg.tokens';
    // A component re-points a token's own property in a part: a rule nested in the component's rule.
    assert.ok(
      inTokens || (layers[0] === 'tg.components' && nested(rule)),
      `${rule.selector} writes ${decl.prop} outside the token layer and the parts`,
    );
  });
});

test("every hover, pressed, focus and disabled rule is a part: nested in its component's rule, in the component layer", () => {
  let parts = 0;
  root.walkRules((rule) => {
    if (
      !/:hover|:active|:focus-visible|:disabled|\[aria-disabled|\[aria-selected|\[aria-pressed|\[aria-checked|\[aria-expanded/.test(
        rule.selector,
      )
    )
      return;
    // A part only re-points token properties or sets one directly; a component names a state to find a part
    // (`:not([aria-expanded='true'])`) in a rule of its own, which is not nested.
    if (nested(rule)) {
      parts += 1;
      assert.deepEqual(layersOf(rule), ['tg.components'], `${flat(rule)} is a part outside the component layer`);
    }
  });
  assert.ok(parts > 40, `${parts} state parts`);
});

test('the stateful components got their parts from the plugin', () => {
  const selectors = new Set<string>();
  root.walkRules((rule) => {
    if (nested(rule)) selectors.add(flat(rule));
  });
  const ruled = (pattern: RegExp) => [...selectors].some((selector) => pattern.test(selector));
  // Each part's spelling sits inside `:where()`, so every part rule weighs what its component's rule weighs.
  assert.ok(ruled(/^\.tg-button:where\(:hover\)$/), 'button hover');
  assert.ok(ruled(/^\.tg-button:where\(:active\)$/), 'button pressed');
  assert.ok(ruled(/^\.tg-button:where\(:focus-visible\)$/), 'button focus');
  assert.ok(ruled(/^\.tg-button:where\(:is\(:disabled, \[aria-disabled='true'\]\)\)$/), 'button disabled');
  assert.ok(ruled(/^\.tg-button:where\(\[data-variant='primary'\]\):where\(:hover\)$/), 'a variant nests its own state values');
  assert.ok(ruled(/^\.tg-button:where\(\[data-variant='link'\]\):where\(:is\(:disabled/), 'a link nests its disabled value');
  assert.ok(ruled(/^tg-tabs > button:where\(:is\(\[aria-selected='true'\]/), 'tab selected');
  assert.ok(ruled(/^tg-segmented > button:where\(:is\(\[aria-selected='true'\]/), 'segmented selected');
  assert.ok(ruled(/^tg-row:where\(:has\(> \[data-part='summary'\]\[aria-expanded='true'\]\)\)$/), 'row open, read from its summary');
  assert.ok(
    ruled(/^tg-row:where\(\[data-tone='warn'\]\):where\(:has\(> \[data-part='summary'\]\[aria-expanded='true'\]\)\)$/),
    'a toned row keeps its gutter open',
  );
  assert.ok(
    ruled(/^tg-row:where\(:is\(\[tabindex\], :has\(> \[data-part='summary'\]\)\)\):where\(:hover\)$/),
    'a row with a tabindex or a summary answers the pointer',
  );
  assert.ok(
    ruled(
      /^tg-row:where\(:is\(\[tabindex\], :has\(> \[data-part='summary'\]\)\)\):where\(:is\(:focus-visible, :has\(> \[data-part='summary'\]:focus-visible\)\)\)$/,
    ),
    "a row shows its summary's focus",
  );
  assert.ok(ruled(/^tg-row:where\(:is\(\[aria-selected='true'\]/), 'an option selected');
  assert.ok(ruled(/^tg-chip:where\(\[aria-pressed\]\):where\(:is\(/), 'chip toggled');
  assert.ok(ruled(/^\.tg-dropzone:where\(:hover\)$/), 'dropzone hover');
  assert.ok(ruled(/^\.tg-select:where\(:hover\)$/), 'select hover');
  // A checkbox reads its label's selected, focus and disabled from its input; the boxed variant inherits that.
  assert.ok(ruled(/^\.tg-checkbox:where\(\[data-variant='boxed'\]\):where\(:has\(> input:checked\)\)$/), 'boxed checkbox checked');
  assert.ok(
    ruled(/^\.tg-checkbox:where\(\[data-variant='boxed'\]\):where\(:has\(> input:is\(:disabled, \[aria-disabled='true'\]\)\)\)$/),
    'boxed checkbox disabled',
  );
  assert.ok(ruled(/^\.tg-field:where\(:has\(> input:focus-visible\)\)$/), "a field shows its input's focus");
});

test('a state is nested after the variants, so it applies to every variant unless the variant nests its own value', () => {
  const rule = [...text.matchAll(/\.tg-button \{[\s\S]*?\n\}\n/g)].map((m) => m[0]).find((r) => r.includes('&:where([data-variant'))!;
  assert.ok(
    rule.indexOf("&:where([data-variant='primary'])") < rule.indexOf('&:where(:hover)'),
    'the variants come before the generic states',
  );
  assert.ok(rule.indexOf("&:where([data-size='sm'])") < rule.lastIndexOf('&:where(:hover)'));
  // The primary variant's own hover is nested in it, a rule of two parts, after every rule of one.
  assert.ok(
    /&:where\(\[data-variant='primary'\]\) \{[\s\S]*?&:where\(:hover\) \{\s*--_tg-button-background-color: var\(--tg-button-primary-hover-background-color/.test(
      rule,
    ),
  );
});

test('every component has a rule in the component layer, written from its token group', () => {
  const reads = (name: string) => new RegExp(`var\\(--tg-${name}-[a-z-]+`);
  for (const name of COMPONENTS) {
    let found = false;
    root.walkDecls((decl) => {
      if (layersOf(decl)[0] === 'tg.components' && reads(name).test(decl.value)) found = true;
    });
    assert.ok(found, `${name} reads its tokens`);
  }
});

test('the components read their tokens as var() with the default as fallback', () => {
  has(
    /\.tg-button\s*\{[^}]*background-color: var\(--_tg-button-background-color, var\(--tg-button-background-color, var\(--tg-bg-raised\)\)\)/,
  );
  has(/\.tg-button\s*\{[^}]*font: var\(--_tg-button-font, var\(--tg-button-font, var\(--tg-text-control\)\)\)/);
  // A tier is a var() link, not a copied literal.
  has(/--tg-button-background-color: var\(--tg-bg-raised\)/);
  has(/--tg-bg-raised: #ffffff/);
});

test('a structured colour with alpha and a shadow come out as CSS', () => {
  has(/--tg-bg-selected: #0c8ce91a/);
  has(/--tg-wash-hover: inset 0px 0px 0px 999px #0000000a/);
  has(/--tg-shadow-pop: 0px 4px 16px 0px/);
});

test('the typography tokens are the font shorthand, with what it cannot carry beside it', () => {
  has(/--tg-text-label: 600 var\(--tg-fs-1\)\/var\(--tg-lh-normal\) var\(--tg-font-ui\)/);
  has(/--tg-text-label-letter-spacing: 0\.06em/);
  // A role is the shorthand read from the token, with the members it cannot carry at their own properties.
  has(
    /\[data-text='label'\]\s*\{[^}]*font: var\(--tg-text-label, 600 var\(--tg-fs-1\)\/var\(--tg-lh-normal\) var\(--tg-font-ui\)\)[^}]*letter-spacing: var\(--tg-text-label-letter-spacing, 0\.06em\)[^}]*text-transform: var\(--tg-text-label-text-transform, uppercase\)/,
  );
});

test('every icon the map names has a rule, and the font is Phosphor', () => {
  for (const name of PHOSPHOR_NAMES)
    assert.ok(new RegExp(`\\.ph-${name}::before\\s*\\{[^}]*content: "\\\\e[0-9a-f]+"`).test(text), `ph-${name}`);
  has(/font-family: 'Phosphor'/);
});

test('a row wraps its parts only when it holds a detail, and its words are cut with an ellipsis', () => {
  has(/tg-row:has\(> \[data-part='detail'\]\)\s*\{\s*flex-wrap: wrap/);
  // The words of a row are a block, since a flex box cannot draw an ellipsis; they are centred by their line height.
  has(
    /:is\(tg-row, tg-row > \[data-part='summary'\]\) > :is\(\[data-part='label'\], \[data-part='value'\]\)\s*\{[^}]*display: block[^}]*text-overflow: ellipsis[^}]*line-height: var\(--_line\)/,
  );
  lacks(/flex-wrap/, text.match(/\ntg-row\s*\{[^}]*\}/)?.[0] ?? '');
});

test("a row with a detail is a disclosure: its summary is a button without a button's face, and the detail shows only while it is open", () => {
  has(/tg-row > \[data-part='summary'\]\s*\{[^}]*flex: 1 1 0[^}]*border: 0[^}]*background: transparent[^}]*font: inherit/);
  // The parts are the row's children, or the summary's.
  has(
    /:is\(tg-row, tg-row > \[data-part='summary'\]\) > :is\(\[data-part='label'\], \[data-part='value'\]\)\s*\{[^}]*text-overflow: ellipsis/,
  );
  // Closed, a detail is hidden even from a page that gives it a display of its own; open is a summary expanded or a selected option.
  has(
    /tg-row:not\(:has\(> \[data-part='summary'\]\[aria-expanded='true'\]\)\):not\(tg-list > tg-row\[aria-selected='true'\]\) > \[data-part='detail'\]\s*\{[^}]*display: none !important/,
  );
  // The old spelling, a state on the host, is gone: the host takes no role and holds no aria-expanded.
  lacks(/tg-row:not\(\[aria-expanded='true'\]\)/, text);
  // Open and focus are the row's own parts, read from its summary through the group's respelled entries: nothing is written by hand.
  let open: postcss.Rule | undefined;
  root.walkRules((rule) => {
    if (nested(rule) && flat(rule) === "tg-row:where(:has(> [data-part='summary'][aria-expanded='true']))") open = rule;
  });
  assert.ok(open, 'the open part');
  assert.deepEqual(layersOf(open), ['tg.components']);
  assert.match(open.toString(), /--_tg-row-border-left-color: var\(--tg-row-open-border-left-color, var\(--tg-accent-bg\)\)/);
  assert.match(open.toString(), /--_tg-row-background-color: var\(--tg-row-open-background-color, var\(--tg-bg-sunken\)\)/);
  // The one rule by hand: the wash is for the line, so over the detail the row is at rest.
  has(
    /tg-row:has\(> \[data-part='summary'\]\):has\(> \[data-part='detail'\]:hover\)\s*\{\s*box-shadow: var\(--tg-row-interactive-box-shadow/,
  );
});

test('a list lays out its options in a column and reads its own tokens', () => {
  has(/tg-list\s*\{[^}]*display: flex[^}]*flex-direction: column[^}]*gap: var\(--tg-list-gap, var\(--tg-sp-0\)\)/);
});

test('a card whose body holds rows or a list has no inline padding, and one that holds words keeps it', () => {
  has(
    /tg-card > \[data-part='body'\]\s*\{[^}]*padding-inline: var\(--_tg-card-body-padding-inline, var\(--tg-card-body-padding-inline, var\(--tg-sp-3\)\)\)/,
  );
  // The flush part is nested in the body's rule, after its declarations, so it re-points the padding the body reads.
  let flush: postcss.Rule | undefined;
  root.walkRules((rule) => {
    if (nested(rule) && flat(rule) === "tg-card > [data-part='body']:where(:has(> :is(tg-row, tg-list)))") flush = rule;
  });
  assert.ok(flush, 'the flush part');
  assert.match(flush.toString(), /--_tg-card-body-padding-inline: var\(--tg-card-body-flush-padding-inline, var\(--tg-sp-0\)\)/);
  assert.equal(flush.parent!.nodes.indexOf(flush), flush.parent!.nodes.length - 1, 'it follows the declarations');
});

test('a component that has parts resets the properties its parts re-point in its own rule, before it reads them', () => {
  const ruleOf = (selector: string) => {
    let found: postcss.Rule | undefined;
    root.walkRules((rule) => {
      if (!nested(rule) && rule.selector === selector && rule.toString().includes(': initial')) found = rule;
    });
    assert.ok(found, `the rule ${selector}, with resets`);
    return found;
  };
  for (const [selector, local, read] of [
    ['tg-row', '--_tg-row-background-color', 'background-color'],
    ['.tg-button', '--_tg-button-background-color', 'background-color'],
  ]) {
    const decls = ruleOf(selector).nodes.filter((n): n is postcss.Declaration => n.type === 'decl');
    const reset = decls.findIndex((d) => d.prop === local && d.value === 'initial');
    assert.ok(reset >= 0, `${selector} resets ${local}`);
    assert.ok(
      decls.findIndex((d) => d.prop === read && d.value.includes(`var(${local},`)) > reset,
      `${selector} reads ${local} after the reset`,
    );
  }
  lacks(/@apply|@mixin/, text);
});

test('the fonts are embedded, and weigh what their files weigh', async () => {
  const { statSync } = await import('node:fs');
  for (const file of Object.values(FONTS)) assert.ok(statSync(file).size > 10_000, file);
});
