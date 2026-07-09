import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

// Configuración de OpenNext para Cloudflare Workers.
// Caché incremental en Workers KV (binding NEXT_INC_CACHE_KV en wrangler.jsonc).
// Se usa KV y no R2 porque el token de wrangler tiene permiso workers_kv pero
// no R2; KV es suficiente para ISR/data cache de esta plataforma.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
