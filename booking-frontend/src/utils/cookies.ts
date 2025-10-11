// Cookie utilities for cross-subdomain auth persistence

export function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  // Set cookie for the parent domain (e.g., .localhost) to work across subdomains
  const domain = window.location.hostname.includes("localhost")
    ? ".localhost"
    : window.location.hostname.split(".").slice(-2).join(".");

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${domain};secure=${
    window.location.protocol === "https:"
  };samesite=lax`;
}

export function getCookie(name: string): string | null {
  if (typeof window === "undefined" || typeof document === "undefined")
    return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
}

export function deleteCookie(name: string) {
  if (typeof window === "undefined") return;

  const domain = window.location.hostname.includes("localhost")
    ? ".localhost"
    : window.location.hostname.split(".").slice(-2).join(".");

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`;
}
