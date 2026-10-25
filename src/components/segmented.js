/**
 * `<tg-segmented>`: one of a few choices. A radio group (WAI-ARIA Authoring
 * Practices, "Radio Group"): the arrow keys move focus and the check, one
 * segment stays in the tab order, and the page hears a `tg-change` event.
 */

import { define } from '../define.js';
import { attachChoice } from './choice.js';

define(
  'tg-segmented',
  () =>
    class TgSegmented extends HTMLElement {
      connectedCallback() {
        this.detach = attachChoice(this, { role: 'radiogroup', itemRole: 'radio', chosen: 'aria-checked', pattern: 'radio' });
      }

      disconnectedCallback() {
        this.detach?.();
      }
    },
);
