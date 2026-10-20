// Where the backend lives.
//
// Empty (the default) means "same address as the web app": nginx in Docker, or the Vite dev server,
// forwards /api to the backend. Set VITE_API_URL when the backend is on another address, for example
// when the web app is on Vercel and the API is hosted elsewhere:
//
//   VITE_API_URL=https://safeshare-api.example.com
//
// The browser then talks to the backend directly. (Vercel proxies are cut after 30 seconds, which would
// break the live notifications, so a proxy through Vercel is not used.)
const base = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/+$/, "");

if (base) {
  const toBackend = (url: string) => (url.startsWith("/api/") ? base + url : url);

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    originalFetch(typeof input === "string" ? toBackend(input) : input, init);

  const OriginalEventSource = window.EventSource;
  window.EventSource = class extends OriginalEventSource {
    constructor(url: string | URL, config?: EventSourceInit) {
      super(typeof url === "string" ? toBackend(url) : url, config);
    }
  } as typeof EventSource;
}

export {};
