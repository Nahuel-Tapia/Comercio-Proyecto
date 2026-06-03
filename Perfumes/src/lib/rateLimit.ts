const requests = new Map<string, number[]>();

export function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];
  const recent = timestamps.filter(t => now - t < windowMs);
  
  if (recent.length >= maxRequests) {
    requests.set(ip, recent);
    return false; // Rate limited
  }
  
  recent.push(now);
  requests.set(ip, recent);
  return true; // Allowed
}

// Clean old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const recent = timestamps.filter(t => now - t < 300000);
      if (recent.length === 0) requests.delete(ip);
      else requests.set(ip, recent);
    }
  }, 300000);
}
