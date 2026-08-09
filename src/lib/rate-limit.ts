/**
 * Server-side sliding-window rate limiter for single-instance VPS deployments.
 *
 * DESIGN CONSIDERATIONS & DEPLOYMENT LIMITATIONS:
 * 1. Single-Instance Solution: This in-memory rate limiter stores hit counters in process memory.
 *    - It resets whenever Node.js process restarts.
 *    - It is intended for single VPS deployments (e.g. single Docker container).
 *    - If scaling to multi-instance / multi-node cluster in the future, migrate to a shared Redis store.
 * 2. Reverse Proxy Security (Nginx/Caddy):
 *    - To prevent IP spoofing, the upstream reverse proxy (Nginx/Caddy) MUST overwrite
 *      the incoming `X-Forwarded-For` and `X-Real-IP` headers before forwarding requests to Node.
 *    - Nginx configuration directive example:
 *        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *        proxy_set_header X-Real-IP $remote_addr;
 */

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult =
  | { success: true; remaining: number; resetMs: number }
  | { success: false; remaining: 0; resetMs: number };

class MemoryRateLimiter {
  private hits = new Map<string, number[]>();

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const existing = this.hits.get(key) ?? [];
    const timestamps = existing.filter((time) => time > windowStart);

    if (timestamps.length >= config.maxRequests) {
      const oldest = timestamps[0] ?? now;
      const resetMs = Math.max(0, oldest + config.windowMs - now);
      this.hits.set(key, timestamps);
      return { success: false, remaining: 0, resetMs };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      success: true,
      remaining: config.maxRequests - timestamps.length,
      resetMs: config.windowMs,
    };
  }

  reset(key?: string) {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }
}

export const defaultUploadRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10,     // 10 upload attempts per minute per user/IP
};

export const uploadRateLimiter = new MemoryRateLimiter();

function sanitizeIp(rawIp: string): string {
  const trimmed = rawIp.trim().replace(/^::ffff:/i, "");
  const parts = trimmed.split(":");
  const withoutPort = parts.length === 2 && !trimmed.includes("[") ? parts[0] : trimmed;
  const clean = withoutPort.replace(/[^a-fA-F0-9.:]/g, "");

  return clean || "127.0.0.1";
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    const clientIp = ips[0]?.trim();
    if (clientIp) {
      return sanitizeIp(clientIp);
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return sanitizeIp(realIp);
  }

  return "127.0.0.1";
}

