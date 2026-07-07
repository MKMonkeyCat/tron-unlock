import {
  MK_BASE_CLASS,
  MK_HIDDEN_CLASS,
  MK_HIDDEN_SCROLL_CLASS,
} from './constants';
import { injectStyle } from './utils/dom/style';

export const setupMKStyle = injectStyle(`$css
  .${MK_BASE_CLASS} {
    box-sizing: border-box;
  }

  p.${MK_BASE_CLASS},
  h1.${MK_BASE_CLASS},
  h2.${MK_BASE_CLASS},
  h3.${MK_BASE_CLASS},
  h4.${MK_BASE_CLASS},
  h5.${MK_BASE_CLASS},
  h6.${MK_BASE_CLASS},
  input.${MK_BASE_CLASS},
  select.${MK_BASE_CLASS} {
    margin: 0 !important;
    padding: 0 !important;
    color: inherit !important;
    font-family: inherit !important;
  }

  h1.${MK_BASE_CLASS} {
    font-size: 2em;
  }

  h2.${MK_BASE_CLASS} {
    font-size: 1.5em;
  }

  h3.${MK_BASE_CLASS} {
    font-size: 1.17em;
  }

  h4.${MK_BASE_CLASS} {
    font-size: 1em;
  }

  h5.${MK_BASE_CLASS} {
    font-size: 0.83em;
  }

  h6.${MK_BASE_CLASS} {
    font-size: 0.67em;
  }

  h1.${MK_BASE_CLASS},
  h2.${MK_BASE_CLASS},
  h3.${MK_BASE_CLASS},
  h4.${MK_BASE_CLASS},
  h5.${MK_BASE_CLASS},
  h6.${MK_BASE_CLASS} {
    font-weight: bold;
  }

  .${MK_HIDDEN_CLASS} {
    display: none !important;
  }

  .${MK_HIDDEN_SCROLL_CLASS},
  [class*='${MK_HIDDEN_SCROLL_CLASS}-'] {
    overflow: hidden;
    visibility: visible;
    padding-right: 14px;
  }
`);
