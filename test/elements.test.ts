import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextIndex, tabStop, isActivationKey, optionAction } from '../src/keys.js';
import { dotLabel, DOT_WORDS } from '../src/components/dot.js';
import { calloutMark } from '../src/components/callout.js';
import { ICONS, GLYPHS, ACTIONS, PHOSPHOR_NAMES, iconMarkup } from '../src/icons.js';

const T = true;
const F = false;

test('the elements module can be imported without a DOM: nothing is defined, nothing throws', async () => {
  assert.equal(typeof customElements, 'undefined');
  await import('../src/elements.js');
});

test('a dot says its state in words, and silence says nothing', () => {
  assert.equal(dotLabel('drifted'), 'drifted');
  assert.equal(dotLabel('upstream'), 'drifted upstream');
  assert.equal(dotLabel('absent'), 'not in Figma');
  assert.equal(dotLabel('connected'), 'connected');
  assert.equal(dotLabel('busy'), 'busy');
  assert.equal(dotLabel('idle'), 'idle');
  assert.equal(dotLabel('error'), 'error');
  assert.equal(dotLabel('none'), undefined);
  assert.equal(dotLabel(null), undefined);
  assert.equal(dotLabel(undefined), undefined);
  // Not an object's own words: `constructor` is not a state.
  assert.equal(dotLabel('constructor'), undefined);
  assert.equal(Object.keys(DOT_WORDS).length, 8);
});

test('tabs: the arrow keys move one tab, and wrap', () => {
  const enabled = [T, T, T, T];
  assert.equal(nextIndex('ArrowRight', 0, enabled), 1);
  assert.equal(nextIndex('ArrowRight', 3, enabled), 0);
  assert.equal(nextIndex('ArrowLeft', 1, enabled), 0);
  assert.equal(nextIndex('ArrowLeft', 0, enabled), 3);
});

test('tabs: Home and End go to the ends, and the vertical arrows do nothing in a horizontal list', () => {
  const enabled = [T, T, T];
  assert.equal(nextIndex('Home', 2, enabled), 0);
  assert.equal(nextIndex('End', 0, enabled), 2);
  assert.equal(nextIndex('ArrowDown', 0, enabled), -1);
  assert.equal(nextIndex('ArrowUp', 0, enabled), -1);
  assert.equal(nextIndex('a', 0, enabled), -1);
  assert.equal(nextIndex('Tab', 0, enabled), -1);
});

test('tabs: a vertical list moves with Up and Down, not Left and Right', () => {
  const enabled = [T, T, T];
  assert.equal(nextIndex('ArrowDown', 0, enabled, { orientation: 'vertical' }), 1);
  assert.equal(nextIndex('ArrowUp', 0, enabled, { orientation: 'vertical' }), 2);
  assert.equal(nextIndex('ArrowRight', 0, enabled, { orientation: 'vertical' }), -1);
});

test('what is disabled is passed over, by the arrows and by Home and End', () => {
  const enabled = [F, T, F, T, F];
  assert.equal(nextIndex('ArrowRight', 1, enabled), 3);
  assert.equal(nextIndex('ArrowRight', 3, enabled), 1, 'wraps past the disabled ends');
  assert.equal(nextIndex('ArrowLeft', 1, enabled), 3);
  assert.equal(nextIndex('Home', 3, enabled), 1);
  assert.equal(nextIndex('End', 1, enabled), 3);
});

test('one enabled item: the arrows stay on it; none: nothing moves', () => {
  assert.equal(nextIndex('ArrowRight', 1, [F, T, F]), 1);
  assert.equal(nextIndex('ArrowRight', 0, [F, F]), -1);
  assert.equal(nextIndex('Home', 0, [F, F]), -1);
  assert.equal(nextIndex('ArrowRight', 0, []), -1);
});

test('a radio group (segmented) moves with all four arrows, in either orientation', () => {
  const enabled = [T, T, T];
  for (const orientation of ['horizontal', 'vertical'] as const) {
    assert.equal(nextIndex('ArrowRight', 0, enabled, { pattern: 'radio', orientation }), 1);
    assert.equal(nextIndex('ArrowDown', 1, enabled, { pattern: 'radio', orientation }), 2);
    assert.equal(nextIndex('ArrowLeft', 0, enabled, { pattern: 'radio', orientation }), 2);
    assert.equal(nextIndex('ArrowUp', 1, enabled, { pattern: 'radio', orientation }), 0);
  }
  assert.equal(nextIndex('ArrowRight', 2, [T, F, T], { pattern: 'radio' }), 0);
});

test('a list moves with Up and Down, and stops at the ends instead of wrapping', () => {
  const enabled = [T, T, T];
  const list = { pattern: 'list', orientation: 'vertical' } as const;
  assert.equal(nextIndex('ArrowDown', 0, enabled, list), 1);
  assert.equal(nextIndex('ArrowUp', 2, enabled, list), 1);
  assert.equal(nextIndex('ArrowDown', 2, enabled, list), -1, 'the last option stays last');
  assert.equal(nextIndex('ArrowUp', 0, enabled, list), -1, 'the first option stays first');
  assert.equal(nextIndex('ArrowRight', 0, enabled, list), -1, 'Left and Right belong to a horizontal list');
  assert.equal(nextIndex('Home', 2, enabled, list), 0);
  assert.equal(nextIndex('End', 0, enabled, list), 2);
});

test('a list passes over what is disabled, and does not wrap past it', () => {
  const list = { pattern: 'list', orientation: 'vertical' } as const;
  assert.equal(nextIndex('ArrowDown', 0, [T, F, T], list), 2);
  assert.equal(nextIndex('ArrowUp', 2, [T, F, T], list), 0);
  assert.equal(nextIndex('ArrowDown', 2, [T, F, F], list), -1);
  assert.equal(nextIndex('ArrowDown', 0, [T, F, F], list), -1, 'nothing enabled below');
  assert.equal(nextIndex('Home', 2, [F, T, T], list), 1);
  assert.equal(nextIndex('ArrowDown', 0, [], list), -1);
});

test('a horizontal list moves with Left and Right', () => {
  const list = { pattern: 'list', orientation: 'horizontal' } as const;
  assert.equal(nextIndex('ArrowRight', 0, [T, T], list), 1);
  assert.equal(nextIndex('ArrowLeft', 1, [T, T], list), 0);
  assert.equal(nextIndex('ArrowDown', 0, [T, T], list), -1);
});

test('an option is chosen with Space and activated with Enter; no other key does either', () => {
  assert.equal(optionAction(' '), 'select');
  assert.equal(optionAction('Enter'), 'activate');
  assert.equal(optionAction('a'), null);
  assert.equal(optionAction('ArrowDown'), null);
  assert.equal(optionAction('Tab'), null);
});

test('one item is in the tab order: the chosen one, else the first that can be chosen', () => {
  assert.equal(tabStop(2, [T, T, T]), 2);
  assert.equal(tabStop(2, [T, T, F]), 0, 'the chosen one is disabled');
  assert.equal(tabStop(-1, [F, T, T]), 1, 'nothing chosen');
  assert.equal(tabStop(-1, [F, F]), -1);
});

test('Enter and Space activate; nothing else does', () => {
  assert.ok(isActivationKey('Enter'));
  assert.ok(isActivationKey(' '));
  assert.ok(!isActivationKey('a'));
  assert.ok(!isActivationKey('Tab'));
});

test('a callout chooses its mark by tone: a dot for warn, the warning icon for err, the info icon otherwise', () => {
  assert.deepEqual(calloutMark('warn'), { dot: 'drifted' });
  assert.deepEqual(calloutMark('err'), { icon: 'warning' });
  assert.deepEqual(calloutMark('info'), { icon: 'info' });
  assert.deepEqual(calloutMark('something else'), { icon: 'info' });
});

test('the icon map names every glyph and action icon of the plugin, once, with a Phosphor name', () => {
  assert.deepEqual(Object.keys(GLYPHS), [
    'token',
    'variable',
    'collection',
    'mode',
    'style',
    'group',
    'set',
    'layer',
    'template',
    'sheet',
    'command-line',
    'conventions',
    'look-again',
    'search',
    'info',
    'warning',
    'engine',
  ]);
  assert.deepEqual(Object.keys(ACTIONS), [
    'chevronUp',
    'chevronDown',
    'chevronRight',
    'close',
    'upload',
    'export',
    'plus',
    'windowNarrow',
    'windowWide',
  ]);
  assert.equal(Object.keys(ICONS).length, 26);

  // Each name is an icon Phosphor has (regular weight).
  const phosphor = readFileSync(new URL('../node_modules/@phosphor-icons/web/src/regular/style.css', import.meta.url), 'utf8');
  for (const name of PHOSPHOR_NAMES) assert.ok(phosphor.includes(`.ph-${name}:before`), `Phosphor has ${name}`);
});

test("an icon is written as a Phosphor icon, by the plugin's name or by Phosphor's", () => {
  assert.equal(iconMarkup('token'), '<i class="tg-icon ph ph-diamond" aria-hidden="true"></i>');
  assert.equal(
    iconMarkup('chevronDown', { tone: 'faint', size: 'sm' }),
    '<i class="tg-icon ph ph-caret-down" data-tone="faint" data-size="sm" aria-hidden="true"></i>',
  );
  assert.equal(iconMarkup('check'), '<i class="tg-icon ph ph-check" aria-hidden="true"></i>');
});
