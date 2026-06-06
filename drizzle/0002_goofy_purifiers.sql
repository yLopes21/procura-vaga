-- Pré-requisito: nenhum e-mail duplicado case-insensitive. Verificar antes de aplicar:
--   SELECT lower(email), count(*) FROM "user" GROUP BY 1 HAVING count(*) > 1;
-- (Validado vazio ao aplicar neste projeto.) Se houver duplicata, fundir/remover antes.
CREATE UNIQUE INDEX "user_email_lower_idx" ON "user" USING btree (lower("email"));