"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[][]; loaded?: boolean; version?: string };
    _fbq?: Window["fbq"];
  }
}

function initialize(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else (fbq.queue ||= []).push(args);
  } as NonNullable<Window["fbq"]>;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/pt_BR/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
  fbq("track", "PageView");
}

export function MarketingPixel({ pixelId }: { pixelId: string }) {
  useEffect(() => {
    initialize(pixelId);
  }, [pixelId]);
  return null;
}
