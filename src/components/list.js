/**
 * `<tg-list>`: one row chosen out of several. A listbox (WAI-ARIA Authoring
 * Practices, "Listbox"): the `tg-row`s it holds are its options
 * (`role="option"`, `aria-selected`). One option stays in the tab order (the
 * selected one, else the first); Up and Down move focus (Left and Right when
 * `aria-orientation="horizontal"`), Home and End go to the ends, and a disabled
 * option is passed over.
 *
 *   click, Space   choose the option; the page hears `tg-change`
 *   Enter          activate it; the page hears `tg-activate`. For an option that
 *                  opens something elsewhere, as a folder opens the next column.
 *                  A click on the option that is already chosen activates it too.
 *   data-selection="follows-focus"   the arrow keys choose as they move
 *
 * The page names the list (`aria-label`). An option may hold a `[data-part=detail]`,
 * which shows while the option is selected; clicks inside the detail do not choose.
 */

import { define } from '../define.js';
import { attachChoice } from './choice.js';

define(
  'tg-list',
  () =>
    class TgList extends HTMLElement {
      connectedCallback() {
        this.detach = attachChoice(this, {
          role: 'listbox',
          itemRole: 'option',
          chosen: 'aria-selected',
          pattern: 'list',
          items: ':scope > tg-row',
          orientation: 'vertical',
          activates: true,
        });
      }

      disconnectedCallback() {
        this.detach?.();
      }
    },
);
