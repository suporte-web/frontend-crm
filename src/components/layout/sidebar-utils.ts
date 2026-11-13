import type { AppScreen } from "@/config/screens";

export function isScreenActive(pathname: string, href: string) {
  if (href === '/atendimento' && /^\/atendimento\/(visitas|acoes)(\/|$)/.test(pathname)) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getScreenLabel(item: AppScreen, role?: string) {
  return item.href === "/painel" && role === "CLIENTE"
    ? "Canal do Cliente"
    : item.label;
}
