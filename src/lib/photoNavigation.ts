const RETURN_KEY = "dorsalia-fotos-return";

export function rememberPhotoReturn(href: string) {
  try { sessionStorage.setItem(RETURN_KEY, href); } catch { /* Private mode can block session storage. */ }
}

export function returnToPhotoEvent(href: string) {
  let from = "";
  try {
    from = sessionStorage.getItem(RETURN_KEY) || "";
    sessionStorage.removeItem(RETURN_KEY);
  } catch { /* Ignore storage and replace the current page. */ }
  if (from === href && window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.replace(href);
}
