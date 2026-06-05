/** Normalização canônica para comparação textual: sem acento, minúsculo, aparado.
 *  Fonte única usada por taxonomia (match) e busca (searchJobs) — evita drift. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
