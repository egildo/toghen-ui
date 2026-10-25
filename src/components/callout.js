/**
 * `<tg-callout data-tone="warn">`: draws its mark by tone, so a page says only
 * what the callout means. Inform is the info icon, warn is a dot, stop is the
 * warning icon. The mark is decoration: the title says what it is.
 */

import { define } from '../define.js';
import { ICONS } from '../icons.js';

/** The mark for a tone: a dot's state, or an icon's Phosphor name. */
export function calloutMark(tone) {
  if (tone === 'warn') return { dot: 'drifted' };
  if (tone === 'err') return { icon: ICONS.warning };
  return { icon: ICONS.info };
}

define(
  'tg-callout',
  () =>
    class TgCallout extends HTMLElement {
      static get observedAttributes() {
        return ['data-tone'];
      }

      connectedCallback() {
        this.draw();
      }

      attributeChangedCallback() {
        if (this.isConnected) this.draw();
      }

      draw() {
        const mark = calloutMark(this.getAttribute('data-tone') ?? 'info');
        let part = this.querySelector(':scope > [data-part="mark"]');
        if (!part) {
          part = document.createElement('span');
          part.setAttribute('data-part', 'mark');
          part.setAttribute('aria-hidden', 'true');
          this.prepend(part);
        }
        part.innerHTML = mark.dot
          ? `<tg-dot data-state="${mark.dot}"></tg-dot>`
          : `<i class="tg-icon ph ph-${mark.icon}" aria-hidden="true"></i>`;
      }
    },
);
