export type FunnelEvent = "quiz_started" | "lead_submitted" | "result_viewed" | "checkout_clicked" | "exit_offer_viewed" | "exit_offer_clicked" | "thank_you_viewed";

function trackMarketing(event: FunnelEvent, data: Record<string, unknown>, eventId: string) {
  if (!window.fbq) return;
  const payload = { content_name: String(data.productId || data.profileKey || "Movimento Volta"), content_category: String(data.source || event) };
  if (event === "lead_submitted") window.fbq("track", "Lead", payload, { eventID: eventId });
  else if (event === "checkout_clicked") window.fbq("track", "InitiateCheckout", payload, { eventID: eventId });
  else if (event !== "thank_you_viewed") window.fbq("trackCustom", event, payload, { eventID: eventId });
}

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
  try { trackMarketing(event, data, eventId); } catch { /* A experiência não depende do pixel. */ }
  return fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "funnel", eventType: event, eventId, path: location.pathname, ...data }),
    keepalive: true,
  }).catch(() => undefined);
}
