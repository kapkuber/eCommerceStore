// Lazy, runtime-safe Redis client for Node runtime with dev fallback.
// If ioredis cannot be loaded (e.g., bundler constraints) or REDIS_URL is
// missing, we fall back to an in-memory mock so local dev still works.
type RedisClient = any;

// Minimal in-memory Redis mock for dev
class MemoryRedis {
  store = new Map<string, Map<string, string>>();
  ttl = new Map<string, number>();

  private ensure(key: string) {
    if (!this.store.has(key)) this.store.set(key, new Map());
    return this.store.get(key)!;
  }
  private alive(key: string) {
    const t = this.ttl.get(key);
    if (t && Date.now() > t) {
      this.store.delete(key);
      this.ttl.delete(key);
    }
  }
  async hgetall(key: string) {
    this.alive(key);
    const m = this.store.get(key);
    if (!m) return {} as Record<string, string>;
    const obj: Record<string, string> = {};
    for (const [k, v] of m.entries()) obj[k] = v;
    return obj;
  }
  async hget(key: string, field: string) {
    this.alive(key);
    return this.store.get(key)?.get(field) ?? null;
  }
  async hset(key: string, field: string, value: string) {
    this.ensure(key).set(field, value);
    return 1;
  }
  async expire(key: string, seconds: number) {
    this.ttl.set(key, Date.now() + seconds * 1000);
    return 1;
  }
}

let client: RedisClient | null = null;

export async function getRedis(): Promise<RedisClient> {
  if (client) return client;

  const url = process.env.REDIS_URL;
  // If explicitly using memory or no URL, prefer memory for dev
  if (!url || url.startsWith('memory:')) {
    client = new MemoryRedis();
    return client;
  }

  // Try dynamic import first; fall back to createRequire; else memory
  try {
    const mod = await import('ioredis');
    const RedisCtor: any = (mod as any).default || (mod as any);
    client = new RedisCtor(url);
    return client;
  } catch {
    try {
      const { createRequire } = await import('node:module');
      const req = createRequire(import.meta.url);
      const mod = req('ioredis');
      const RedisCtor: any = (mod && (mod.default || mod));
      client = new RedisCtor(url);
      return client;
    } catch {
      // Dev fallback
      client = new MemoryRedis();
      return client;
    }
  }
}

// Optional convenience: prefer calling getRedis() directly in API routes.
export const redis = getRedis();
