import type { AppScreen } from "@/config/screens";
import type { CrmNotification } from "@/types/notifications";

export function isUnreadChatNotification(notification: CrmNotification) {
  if (notification.readAt) return false;

  const type = String(notification.metadata?.type ?? "").toUpperCase();
  const text = `${notification.title} ${notification.message}`.toLowerCase();

  return (
    type === "CHAT_MESSAGE" ||
    text.includes("chat") ||
    text.includes("mensagem")
  );
}

export function isScreenActive(pathname: string, href: string) {
  if (href === '/atendimento' && /^\/atendimento\/(visitas|acoes)(\/|$)/.test(pathname)) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getScreenLabel(item: AppScreen, role?: string) {
  return item.href === "/painel" && role === "CLIENTE"
    ? "Canal do Cliente"
    : item.label;
}
