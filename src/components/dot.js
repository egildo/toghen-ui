/**
 * `<tg-dot data-state="drifted">`: gives a dot its spoken label. A dot draws a
 * state and says nothing, so the element says it; a state that is silence (no
 * `data-state`, or one with no words) takes the role and the label away.
 *
 * A dot that opens something is a button, and its page says so with a `role`:
 * the element then only supplies the label, and never takes that role away.
 */

import { define } from '../define.js';

/** What each dot means, for a screen reader. */
export const DOT_WORDS = {
  drifted: 'drifted',
  upstream: 'drifted upstream',
  absent: 'not in Figma',
  unread: 'not inspected',
  connected: 'connected',
  busy: 'busy',
  idle: 'idle',
  error: 'error',
};

/** The words for a state, or undefined when the dot is silence. */
export const dotLabel = (state) => (state && Object.hasOwn(DOT_WORDS, state) ? DOT_WORDS[state] : undefined);

define(
  'tg-dot',
  () =>
    class TgDot extends HTMLElement {
      static get observedAttributes() {
        return ['data-state'];
      }

      connectedCallback() {
        this.label();
      }

      attributeChangedCallback() {
        this.label();
      }

      label() {
        const words = dotLabel(this.getAttribute('data-state'));
        const role = this.getAttribute('role');
        if (words) {
          if (!role) this.setAttribute('role', 'img');
          this.setAttribute('aria-label', words);
        } else {
          if (role === 'img') this.removeAttribute('role');
          this.removeAttribute('aria-label');
        }
      }
    },
);
