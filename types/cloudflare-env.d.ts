declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    [key: string]: unknown;
  }
}
