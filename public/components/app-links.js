export function mountAppLinks(origin) {
  if (!origin) return;
  for (const link of document.querySelectorAll('[data-app-link]')) {
    link.href = new URL(link.dataset.appLink, origin).href;
  }
}
