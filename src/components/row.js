/**
 * `<tg-row>`: a row that opens. A row with a `[data-part="detail"]` is a
 * disclosure (WAI-ARIA Authoring Practices, "Disclosure"): the element provides
 * its summary, a `<button data-part="summary">` that holds the leading mark, the
 * label and the value, with `aria-expanded` and `aria-controls` pointing at the
 * detail. The trailing part stays outside the button, where actions may live;
 * the detail is the region the button controls. The host takes no role.
 *
 *   <tg-row>
 *     <span data-part="leading">…</span><span data-part="label">…</span><span data-part="value">…</span>
 *     <span data-part="trailing">…</span>
 *     <div data-part="detail">…</div>
 *   </tg-row>
 *
 * The page may write `aria-expanded="true"` on the host to start it open; the
 * element moves it onto the summary, where it belongs. A click on the summary
 * (the platform gives it Enter and Space) toggles it, and the page hears a
 * `tg-toggle` event. A click anywhere else in the row, the detail included, does
 * not.
 *
 * A page that writes its own `<button data-part="summary">` (a row whose line
 * loads something, with an action in its trailing part) keeps it: it is wired
 * the same way when the row has a detail, and left alone when it has none.
 *
 * A row in a `tg-list` is an option, not a disclosure: the list owns its roles
 * and keys, and its detail shows while it is selected.
 *
 * A row with neither is the page's to act on. An interactive one (`tabindex`)
 * is not a native button, so Enter and Space on it are a click: the page listens
 * for the click only, and the keyboard reaches it too.
 */

import { define } from '../define.js';
import { isActivationKey } from '../keys.js';

let serial = 0;

define(
  'tg-row',
  () =>
    class TgRow extends HTMLElement {
      static get observedAttributes() {
        return ['aria-expanded'];
      }

      connectedCallback() {
        this.addEventListener('click', this);
        this.addEventListener('keydown', this);
        this.disclose();
      }

      disconnectedCallback() {
        this.removeEventListener('click', this);
        this.removeEventListener('keydown', this);
      }

      attributeChangedCallback(name, was, value) {
        if (value !== null && this.isConnected) this.disclose();
      }

      get summary() {
        return this.querySelector(':scope > [data-part="summary"]');
      }

      get inList() {
        return this.parentElement?.localName === 'tg-list';
      }

      /** Gives a row with a detail its summary button, and the summary its state. */
      disclose() {
        const detail = this.querySelector(':scope > [data-part="detail"]');
        if (!detail || this.inList) return;

        let summary = this.summary;
        if (!summary) {
          const parts = [...this.children].filter(
            (child) => child.hasAttribute('data-part') && !child.matches('[data-part="trailing"], [data-part="detail"]'),
          );
          if (!parts.length) return;
          summary = document.createElement('button');
          summary.type = 'button';
          summary.setAttribute('data-part', 'summary');
          parts[0].before(summary);
          summary.append(...parts);
        }
        detail.id ||= `tg-row-detail-${++serial}`;
        summary.setAttribute('aria-controls', detail.id);
        // The state is the summary's; what the page wrote on the host is its way of starting open.
        const written = this.getAttribute('aria-expanded');
        if (written !== null) this.removeAttribute('aria-expanded');
        if (written !== null || !summary.hasAttribute('aria-expanded')) summary.setAttribute('aria-expanded', String(written === 'true'));
      }

      handleEvent(event) {
        if (event.type === 'click') {
          const summary = event.target.closest?.('[data-part="summary"]');
          if (!summary || summary.parentElement !== this || !summary.hasAttribute('aria-expanded')) return;
          const expanded = summary.getAttribute('aria-expanded') !== 'true';
          summary.setAttribute('aria-expanded', String(expanded));
          this.dispatchEvent(new CustomEvent('tg-toggle', { bubbles: true, detail: { expanded } }));
          return;
        }
        // Enter and Space on an interactive row that is neither a disclosure nor an option are a click.
        if (event.target === this && this.hasAttribute('tabindex') && !this.inList && !this.summary && isActivationKey(event.key)) {
          event.preventDefault();
          this.click();
        }
      }
    },
);
