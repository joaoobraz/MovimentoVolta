export type FunnelEvent =
  | "quiz_page_viewed"
  | "quiz_started"
  | "quiz_question_viewed"
  | "quiz_question_answered"
  | "quiz_lead_form_viewed"
  | "quiz_lead_form_started"
  | "quiz_abandoned"
  | "lead_submitted"
  | "result_viewed"
  | "checkout_clicked"
  | "exit_offer_viewed"
  | "exit_offer_clicked"
  | "thank_you_viewed";

const visitStorageKey = "volta-funnel-visit-id";

function getVisitId() {
  try {
    const saved = sessionStorage.getItem(visitStorageKey);
    if (saved) return saved;
    const created = crypto.randomUUID();
    sessionStorage.setItem(visitStorageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function trackMarketing(event: FunnelEvent, data: Record<string, unknown>, eventId: string) {
  if (!window.fbq) return;
  const payload = { content_name: String(data.productId || data.profileKey || "Movimento Volta"), content_category: String(data.source || event) };
  if (event === "lead_submitted") window.fbq("track", "Lead", payload, { eventID: eventId });
  else if (event === "checkout_clicked") window.fbq("track", "InitiateCheckout", payload, { eventID: eventId });
  else if (["quiz_started", "result_viewed", "exit_offer_viewed", "exit_offer_clicked"].includes(event)) window.fbq("trackCustom", event, payload, { eventID: eventId });
}

export function trackFunnel(event: FunnelEvent, data: Record<string, unknown> = {}) {
  const visitId = getVisitId();
  const identity = String(data.leadId || data.productId || visitId);
  const detail = String(data.questionId || data.questionIndex || data.stepKind || "stage");
  const storageKey = `volta-funnel:${event}:${identity}:${detail}`;
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
    body: JSON.stringify({ action: "funnel", eventType: event, eventId, path: location.pathname, trackingVersion: 2, visitId, ...data }),
    keepalive: true,
  }).catch(() => undefined);
}
