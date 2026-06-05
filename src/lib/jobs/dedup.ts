/**
 * Chave de cluster para deduplicação de vagas: empresa + título normalizado + UF.
 * Duas vagas com a mesma chave são a MESMA vaga replicada em fontes diferentes —
 * a ingestão marca o cluster (dedup_cluster_id), mas NUNCA esconde uma réplica
 * ABERTA (a marcação é só rótulo).
 *
 * A chave usa texto normalizado (sem acento, minúsculo, sem pontuação) — isso é
 * só a CHAVE de agrupamento; a exibição preserva company/title originais.
 */
export interface DedupInput {
  company: string;
  title: string;
  uf: string | null;
}

const slug = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // pontuação → espaço
    .trim()
    .replace(/\s+/g, " "); // colapsa espaços

export function dedupClusterKey({ company, title, uf }: DedupInput): string {
  return [slug(company), slug(title), (uf ?? "na").toLowerCase()].join("|");
}
