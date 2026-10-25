/**
 * `<tg-chip>`: a chip with `aria-pressed` is a toggle, so it is a button to the
 * keyboard: it takes a role and a place in the tab order if the page gave none,
 * and Enter or Space press it. The page flips `aria-pressed`; the stylesheet
 * reads it.
 */

import { define } from '../define.js';
import { isActivationKey } from '../keys.js';

define(
  'tg-chip',
  () =>
    class TgChip extends HTMLElement {
      static get observedAttributes() {
        return ['aria-pressed'];
      }

      connectedCallback() {
        this.addEventListener('keydown', this);
        this.upgrade();
      }

      disconnectedCallback() {
        this.removeEventListener('keydown', this);
      }

      attributeChangedCallback() {
        if (this.isConnected) this.upgrade();
      }

      handleEvent(event) {
        if (event.target === this && isActivationKey(event.key)) {
          event.preventDefault();
          this.click();
        }
      }

      upgrade() {
        if (!this.hasAttribute('aria-pressed')) return;
        if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      }
    },
);
