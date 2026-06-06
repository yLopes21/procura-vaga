"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (só em produção — SW + HMR do dev brigam).
 * Renderiza nada; é só o efeito de registro. Falha silenciosa é aceitável: sem SW,
 * o app continua funcionando online, só perde o modo instalável/offline.
 */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sem SW: degrada para web app normal */
    });
  }, []);
  return null;
}
