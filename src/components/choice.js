/**
 * What tabs, a segmented control and a list share: one item chosen out of
 * several, a roving tabindex, and arrow keys. Each element names the attribute
 * that holds "chosen" (`aria-selected` or `aria-checked`) and the pattern it
 * follows.
 *
 * Light DOM: the items are the host's own children (`<button>`s, or `<tg-row>`s
 * in a list), and the application may replace them at any time, so the host
 * listens by delegation and re-reads its items after a change.
 *
 * A list's items are not native buttons, so the host also handles their keys
 * (Space chooses, Enter activates: `activates`), and a click on an item that is
 * already chosen is an activation, since there is nothing left to choose.
 */

import { nextIndex, optionAction, tabStop } from '../keys.js';

/**
 * @param {HTMLElement} host
 * @param {{
 *   role: string,
 *   itemRole: string,
 *   chosen: 'aria-selected' | 'aria-checked',
 *   pattern: 'tabs' | 'radio' | 'list',
 *   items?: string,
 *   orientation?: 'horizontal' | 'vertical',
 *   activates?: boolean,
 * }} options `items` is the selector of the items (default the host's own buttons); `orientation` is
 * the one used when the host does not say (`aria-orientation`); `activates` makes Enter and a second
 * click dispatch `tg-activate`.
 * @returns {() => void} detaches everything
 */
export function attachChoice(
  host,
  { role, itemRole, chosen, pattern, items: selector = ':scope > button', orientation: fallback = 'horizontal', activates = false },
) {
  const items = () => [...host.querySelectorAll(selector)];
  const isEnabled = (item) => item.getAttribute('aria-disabled') !== 'true' && !item.disabled;
  const orientation = () => ((host.getAttribute('aria-orientation') ?? fallback) === 'vertical' ? 'vertical' : 'horizontal');
  /** Whether moving focus also chooses: always for a radio group, by the page's say for the others. */
  const follows = () =>
    pattern === 'radio' || (pattern === 'tabs' ? host.dataset.activation !== 'manual' : host.dataset.selection === 'follows-focus');
  /** The item a node belongs to: the host's child that holds it, if that is an item. */
  const itemOf = (node) => {
    let at = node;
    while (at && at.parentElement !== host) at = at.parentElement;
    return at && items().includes(at) ? at : null;
  };

  /** Sets roles and the roving tabindex from what is chosen. */
  function refresh() {
    host.setAttribute('role', role);
    const all = items();
    const stop = tabStop(
      all.findIndex((item) => item.getAttribute(chosen) === 'true'),
      all.map(isEnabled),
    );
    all.forEach((item, index) => {
      item.setAttribute('role', itemRole);
      if (!item.hasAttribute(chosen)) item.setAttribute(chosen, 'false');
      const tabindex = index === stop ? '0' : '-1';
      if (item.getAttribute('tabindex') !== tabindex) item.setAttribute('tabindex', tabindex);
    });
  }

  const say = (type, item) =>
    host.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        detail: { item, index: items().indexOf(item), value: item.dataset.value ?? item.value ?? null },
      }),
    );

  /** Chooses one item and tells the host's listeners. */
  function choose(item) {
    for (const other of items()) other.setAttribute(chosen, String(other === item));
    refresh();
    say('tg-change', item);
  }

  const onClick = (event) => {
    const item = itemOf(event.target);
    if (!item || !isEnabled(item)) return;
    // A control inside the item (a button in its detail) is not a choice of the item.
    const control = event.target.closest?.('button, a, input, select, textarea, [data-part="detail"]');
    if (control && control !== item && item.contains(control)) return;
    if (item.getAttribute(chosen) !== 'true') choose(item);
    else if (activates) say('tg-activate', item);
  };

  const onKeydown = (event) => {
    const all = items();
    const current = all.indexOf(event.target);
    if (current < 0) return;
    const action = activates ? optionAction(event.key) : null;
    if (action) {
      event.preventDefault();
      if (!isEnabled(all[current])) return;
      if (action === 'activate') say('tg-activate', all[current]);
      else if (all[current].getAttribute(chosen) !== 'true') choose(all[current]);
      return;
    }
    const target = nextIndex(event.key, current, all.map(isEnabled), { pattern, orientation: orientation() });
    if (target < 0) return;
    event.preventDefault();
    all[target].focus();
    if (follows()) choose(all[target]);
  };

  host.addEventListener('click', onClick);
  host.addEventListener('keydown', onKeydown);
  // The application replaces or re-marks the items; roles and tab stop follow.
  const observer = new MutationObserver(refresh);
  observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: [chosen, 'aria-disabled', 'disabled'] });
  refresh();

  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('keydown', onKeydown);
    observer.disconnect();
  };
}
