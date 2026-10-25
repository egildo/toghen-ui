/**
 * `<tg-tabs>`: which pane is in front. A tab list (WAI-ARIA Authoring
 * Practices, "Tabs"): Left and Right move between tabs, Home and End go to the
 * ends, one tab stays in the tab order, and a disabled tab is passed over.
 * Arrow keys also choose the tab they land on (automatic activation); set
 * `data-activation="manual"` to choose with Enter or Space instead, for a pane
 * that is slow to show. The page hears a `tg-change` event.
 */

import { define } from '../define.js';
import { attachChoice } from './choice.js';

define(
  'tg-tabs',
  () =>
    class TgTabs extends HTMLElement {
      connectedCallback() {
        this.detach = attachChoice(this, { role: 'tablist', itemRole: 'tab', chosen: 'aria-selected', pattern: 'tabs' });
      }

      disconnectedCallback() {
        this.detach?.();
      }
    },
);
