// Wspólne funkcje dla integracji Przelewy24 — używane przez p24-create-payment
// i p24-webhook. Dokumentacja: https://developers.przelewy24.pl/

export function p24BaseUrl(sandbox: boolean): string {
  return sandbox ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl';
}

/** SHA384 w hex — Deno ma Web Crypto API wbudowane, bez zewnętrznych zależności. */
export async function sha384Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-384', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function p24BasicAuthHeader(posId: string, apiKey: string): string {
  return 'Basic ' + btoa(`${posId}:${apiKey}`);
}
