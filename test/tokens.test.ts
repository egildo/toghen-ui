import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Resolver, load, type DesignSystem } from '@toghen/lib';
import { COMPONENTS } from './components.ts';

const entry = fileURLToPath(new URL('../tokens/toghen-plugin.resolver.json', import.meta.url));

/** The document as plain data: the tests read it by path, as the plugin reads it. */
async function document(): Promise<any> {
  return (await load(entry, { read: (path) => readFile(path, 'utf8') })).document;
}

async function system(): Promise<DesignSystem> {
  return new Resolver(await document()).resolveContextsToDesignSystem();
}

test('the resolver document loads its token files and resolves', async () => {
  assert.ok(await system());
});

test('the theme is the only modifier: states and variants are parts, not contexts', async () => {
  const doc = await document();
  assert.deepEqual(Object.keys(doc.modifiers), ['theme']);
  assert.deepEqual(
    (doc.resolutionOrder as { $ref: string }[]).map((entry) => entry.$ref),
    ['#/sets/base', '#/modifiers/theme'],
  );
  const css = (doc.modifiers.theme as any).$extensions['com.toghen'].css;
  assert.equal(css.selector, ".figma-{context}, [data-theme='{context}']");
});

test('the vocabulary on the root names the attribute axes first, then the five state axes, each with its CSS spelling', async () => {
  const vocabulary = (await system()).getCollection('toghen-plugin')!.vocabularyAt('tg');
  const axes = Object.keys(vocabulary);
  // Precedence between parts is vocabulary order: a state beats a variant unless the variant nests its own value.
  assert.deepEqual(axes.slice(-5), ['selection', 'disclosure', 'pointer', 'focus', 'availability']);
  assert.ok(axes.indexOf('variant') < axes.indexOf('selection'));
  assert.deepEqual(vocabulary.selection, {
    selected: ":is([aria-selected='true'], [aria-pressed='true'], [aria-checked='true'], :checked)",
  });
  assert.deepEqual(vocabulary.disclosure, { open: "[aria-expanded='true']" });
  assert.deepEqual(vocabulary.pointer, { hover: ':hover', pressed: ':active' });
  assert.deepEqual(vocabulary.focus, { focus: ':focus-visible' });
  assert.deepEqual(vocabulary.availability, { disabled: ":is(:disabled, [aria-disabled='true'])" });
  assert.equal(vocabulary.variant.primary, "[data-variant='primary']");
  assert.equal(vocabulary.size.sm, "[data-size='sm']");
  assert.equal(vocabulary.density.dense, "[data-density='dense']");
  // An axis whose keys are also the names of a semantic group (warn, err, ok) is declared on the components that use it, not on the root.
  assert.equal(vocabulary.tone, undefined);
  const collection = (await system()).getCollection('toghen-plugin')!;
  assert.equal(collection.vocabularyAt('tg.chip').tone.warn, "[data-tone='warn']");
  assert.equal(collection.vocabularyAt('tg.table.cell').tone.err, "[data-tone='err']");
  assert.deepEqual(collection.partsOf('tg.status.warn.bg').parts, [], 'the semantic tier has no parts');
  // One key belongs to one axis: the lookup refuses a vocabulary that says otherwise.
  const keys = Object.values(vocabulary).flatMap((values) => Object.keys(values));
  assert.equal(new Set(keys).size, keys.length);
});

test('a component that reads its states elsewhere respells one entry and keeps the rest', async () => {
  const collection = (await system()).getCollection('toghen-plugin')!;
  // A checkbox reads selected, focus and disabled from its input; the boxed variant below inherits that.
  assert.equal(collection.vocabularyAt('tg.checkbox.boxed').selection.selected, ':has(> input:checked)');
  assert.equal(collection.vocabularyAt('tg.checkbox').focus.focus, ':has(> input:focus-visible)');
  assert.equal(collection.vocabularyAt('tg.checkbox').availability.disabled, ":has(> input:is(:disabled, [aria-disabled='true']))");
  assert.equal(collection.vocabularyAt('tg.checkbox').pointer.hover, ':hover');
  // A row opens by its summary, and is interactive with a tabindex or a summary.
  assert.equal(collection.vocabularyAt('tg.row').disclosure.open, ":has(> [data-part='summary'][aria-expanded='true'])");
  assert.equal(collection.vocabularyAt('tg.row').interaction.interactive, ":is([tabindex], :has(> [data-part='summary']))");
  // Elsewhere the root's spelling stands.
  assert.equal(collection.vocabularyAt('tg.button').disclosure.open, "[aria-expanded='true']");
});

test('states and variants are subgroups of the component, a variant naming its own state value where it needs one', async () => {
  const collection = (await system()).getCollection('toghen-plugin')!;
  const parts = (path: string) => collection.partsOf(path).parts.map((part) => `${part.axis}:${part.key}`);
  assert.deepEqual(parts('tg.button.hover.backgroundColor'), ['pointer:hover']);
  assert.deepEqual(parts('tg.button.primary.hover.backgroundColor'), ['variant:primary', 'pointer:hover']);
  assert.deepEqual(parts('tg.row.warn.open.borderLeftColor'), ['tone:warn', 'disclosure:open']);
  // The twin of a part token is its path with the parts removed.
  assert.equal(collection.partsOf('tg.button.primary.hover.backgroundColor').rest, 'tg.button.backgroundColor');
  assert.equal(collection.partsOf('tg.checkbox.focus.input.outlineColor').rest, 'tg.checkbox.input.outlineColor');
  assert.equal(collection.partsOf('tg.table.dense.cell.height').rest, 'tg.table.cell.height');
  assert.equal(collection.getNodeKind('tg.button.hover.backgroundColor'), 'token');
  assert.equal(collection.getNodeKind('tg.button.disabled'), 'group', 'a part is a group');
});

test('every component has a token group keyed by CSS property', async () => {
  const collection = (await system()).getCollection('toghen-plugin')!;
  for (const name of COMPONENTS) {
    assert.equal(collection.getNodeKind(`tg.${name}`), 'group', `tg.${name} is a group`);
    // Keyed by the property it fills: every direct token is spelled as a CSS property in camelCase.
    const own = collection.getAllPaths().filter((path) => path.startsWith(`tg.${name}.`) && path.split('.').length === 3);
    for (const path of own) assert.match(path.split('.')[2], /^[a-z]+([A-Z][a-z]+)*$/, `${path} is spelled as a CSS property`);
  }
});

test('the component tier takes its values from the semantic tier, as references', async () => {
  const doc = await document();
  const base = (doc.sets.base as any).sources[0].tg;
  assert.equal(base.button.backgroundColor.$value, '{tg.bg.raised}');
  assert.equal(base.button.primary.backgroundColor.$value, '{tg.accent.bg}');
  assert.equal(base.tabs.tab.font.$value, '{tg.text.tab}');
  // No colour of the component tier is a literal: a colour is the theme's to say.
  const literalColours: string[] = [];
  const walk = (node: any, path: string) => {
    for (const [key, child] of Object.entries<any>(node)) {
      if (key.startsWith('$')) continue;
      if (child.$type === 'color' && typeof child.$value !== 'string') literalColours.push(`${path}.${key}`);
      else if (child.$value === undefined) walk(child, `${path}.${key}`);
    }
  };
  for (const name of COMPONENTS) if (base[name]) walk(base[name], `tg.${name}`);
  assert.deepEqual(literalColours, []);
});

test('a state or variant part that re-points a rest token has that token', async () => {
  const collection = (await system()).getCollection('toghen-plugin')!;
  const lone = new Set([
    'tg.icon.muted.color',
    'tg.icon.faint.color',
    'tg.button.link.textDecoration',
    'tg.button.link.hover.textDecoration',
    'tg.button.link.disabled.textDecoration',
  ]);
  let checked = 0;
  for (const path of collection.getAllPaths()) {
    const { parts, rest, restExists } = collection.partsOf(path);
    if (!parts.length) continue;
    // A part is allowed to stand alone (a toggle's ring, a row's wash, a boxed checkbox's tint): only the states of a rest token must have it.
    const states = parts.filter((part) => ['selection', 'disclosure', 'pointer', 'focus', 'availability'].includes(part.axis));
    if (!states.length || lone.has(path) || parts.some((part) => ['toggle', 'interactive', 'boxed'].includes(part.key))) continue;
    if (restExists) checked += 1;
    else assert.fail(`${path} has no rest token ${rest}`);
  }
  assert.ok(checked > 40, `${checked} state tokens re-point a rest token`);
});

test('the structured shapes of W3C are used: colours with components, dimensions with units, font lists', async () => {
  const doc = await document();
  const base = (doc.sets.base as any).sources[0].tg;
  assert.deepEqual(base.sz[4].$value, { value: 12, unit: 'px' });
  assert.deepEqual(base.font.ui.$value.slice(0, 1), ['Geist']);
  assert.equal(base.accent['bg-hover'].$value.colorSpace, 'srgb');
  assert.equal(base.accent['bg-hover'].$value.components.length, 3);
  assert.equal(base.text.label.$type, 'typography');
  assert.deepEqual(base.text.label.$value.letterSpacing, { value: 0.06, unit: 'em' });
  assert.equal(base.text.label.$value.textTransform, 'uppercase');
  // A colour with alpha, and a shadow with an inset layer.
  const [light] = (doc.modifiers.theme as any).contexts.light;
  assert.equal(light.tg.wash.hover.$value[0].inset, true);
  assert.equal(light.tg.wash.hover.$value[0].color.alpha, 0.04);
});

test('the semantic tier is tidied: a step for 6 px, no unused step, both 22 px heights kept', async () => {
  const base = ((await document()).sets.base as any).sources[0].tg;
  assert.deepEqual(base.sp['1-5'].$value, { value: 6, unit: 'px' });
  assert.equal(base.sp['5'], undefined, 'the unused sp.5 is gone');
  assert.equal(base.r.pill, undefined, 'the unused r.pill is gone');
  assert.deepEqual(base.h['row-dense'].$value, base.h['ctl-sm'].$value);
  assert.ok(base.h['row-dense'] && base.h['ctl-sm']);
});

test('the typography tokens exist for each recipe the screen repeats', async () => {
  const collection = (await system()).getCollection('toghen-plugin')!;
  for (const name of ['body', 'small', 'label', 'code', 'title', 'heading']) {
    assert.ok(collection.getToken(`tg.text.${name}`) !== null, `tg.text.${name}`);
    assert.equal(collection.getToken(`tg.text.${name}`)?.$type, 'typography');
  }
});
