/**
 * `<tg-card>`: a card whose body is the bordered box. Loose children (anything
 * that is not the label) are wrapped in a `[data-part="body"]`, so
 * `<tg-card>words</tg-card>` and a card with a label and a body are the same
 * thing to the stylesheet.
 */

import { define } from '../define.js';

define(
  'tg-card',
  () =>
    class TgCard extends HTMLElement {
      connectedCallback() {
        if (this.querySelector(':scope > [data-part="body"]')) return;
        const body = document.createElement('div');
        body.setAttribute('data-part', 'body');
        for (const child of [...this.childNodes]) {
          if (!(child instanceof Element && child.matches('[data-part="label"]'))) body.append(child);
        }
        this.append(body);
      }
    },
);
