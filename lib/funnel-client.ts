export type FunnelEvent = "quiz_started" | "result_viewed" | "checkout_clicked" | "exit_offer_viewed" | "exit_offer_clicked" | "thank_you_viewed";

export function trackFunnel(event: FunnelEvent, data: Record<string, unknown> = {}) {
  const identity = String(data.leadId || data.productId || "visit");
  const storageKey = `volta-funnel:${event}:${identity}`;
  let eventId = `funnel-${event}-${identity}`;
  try {
    const previous = sessionStorage.getItem(storageKey);
    if (previous) return Promise.resolve();
    eventId = `${eventId}-${crypto.randomUUID()}`;
    sessionStorage.setItem(storageKey, eventId);
  } catch { /* O rastreamento continua sem armazenamento local. */ }
  return fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "funnel", eventType: event, eventId, path: location.pathname, ...data }),
    keepalive: true,
  }).catch(() => undefined);
}
