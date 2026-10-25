/**
 * The keyboard, as pure functions: no element, no event, so a test can hold them.
 *
 * Tabs and a segmented control follow the WAI-ARIA Authoring Practices:
 * tabs (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) move with Left and
 * Right in a horizontal list, Home and End jump to the ends; a radio group
 * (https://www.w3.org/WAI/ARIA/apg/patterns/radio/) moves with all four arrows
 * and wraps. A listbox
 * (https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) moves with Up and Down
 * (Left and Right when horizontal) and stops at the ends. All skip what is
 * disabled, and all keep one item in the tab order (a roving tabindex).
 */

/** Keys that activate a control that is not a native button. */
export const isActivationKey = (key) => key === 'Enter' || key === ' ';

/**
 * What a key does to the option that has focus in a listbox: Space chooses it,
 * Enter activates it (it opens something elsewhere); any other key does neither.
 *
 * @param {string} key a `KeyboardEvent.key`
 * @returns {'select' | 'activate' | null}
 */
export const optionAction = (key) => (key === ' ' ? 'select' : key === 'Enter' ? 'activate' : null);

const STEP = {
  tabs: {
    horizontal: { ArrowRight: 1, ArrowLeft: -1 },
    vertical: { ArrowDown: 1, ArrowUp: -1 },
  },
  radio: {
    horizontal: { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 },
    vertical: { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 },
  },
  list: {
    horizontal: { ArrowRight: 1, ArrowLeft: -1 },
    vertical: { ArrowDown: 1, ArrowUp: -1 },
  },
};

/** Whether a pattern wraps from one end to the other: tabs and radios do, a list stops. */
const WRAPS = { tabs: true, radio: true, list: false };

/**
 * The index an arrow key, Home or End moves to, or -1 when the key moves
 * nowhere (another key, or nothing enabled).
 *
 * @param {string} key a `KeyboardEvent.key`
 * @param {number} current the index that has focus
 * @param {boolean[]} enabled for each item, whether it can be chosen
 * @param {{ pattern?: 'tabs' | 'radio' | 'list', orientation?: 'horizontal' | 'vertical' }} [options]
 */
export function nextIndex(key, current, enabled, { pattern = 'tabs', orientation = 'horizontal' } = {}) {
  const count = enabled.length;
  if (!enabled.some(Boolean)) return -1;
  if (key === 'Home') return enabled.indexOf(true);
  if (key === 'End') return enabled.lastIndexOf(true);

  const step = STEP[pattern]?.[orientation]?.[key];
  if (!step) return -1;
  // Walk in the direction of the key, wrapping where the pattern does, until an enabled item turns up.
  for (let i = 1; i <= count; i++) {
    const at = current + step * i;
    if (!WRAPS[pattern] && (at < 0 || at >= count)) return -1;
    const candidate = ((at % count) + count) % count;
    if (enabled[candidate]) return candidate;
  }
  return -1;
}

/**
 * The one item that is in the tab order: the chosen one if it can be chosen,
 * else the first that can. -1 when nothing can.
 *
 * @param {number} chosen the index that is selected or checked, or -1
 * @param {boolean[]} enabled
 */
export function tabStop(chosen, enabled) {
  if (chosen >= 0 && enabled[chosen]) return chosen;
  return enabled.indexOf(true);
}
