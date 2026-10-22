import { mountFilm } from './film.js?v=20261022';
import { mountSystemTheme } from './theme.js';

mountFilm(document.querySelector('[data-film]'));
mountSystemTheme();
