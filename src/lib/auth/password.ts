import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash de senha com `scrypt` (KDF da própria stdlib do Node).
 *
 * IMPORTANTE: SÓ roda em runtime Node — `node:crypto` (scrypt/timingSafeEqual)
 * NÃO existe no Edge Runtime (Vercel Edge / middleware). Quem chamar isto tem
 * de garantir `export const runtime = "nodejs"` na rota/handler.
 *
 * Decisões de segurança:
 * - salt aleatório de 16 bytes por hash (dois hashes da mesma senha diferem),
 *   o que neutraliza rainbow tables e revela vazamento de salt fixo;
 * - keylen 64 (derived key forte);
 * - comparação com `timingSafeEqual` (tempo constante) para não vazar, pelo
 *   tempo de resposta, o quão "perto" a senha estava — defesa contra timing attack;
 * - `verifyPassword` é fail-closed: qualquer entrada ausente/malformada → false,
 *   nunca lança nem "deixa passar".
 *
 * Formato armazenado: `scrypt$<saltHex>$<hashHex>`.
 */

const SCHEME = "scrypt";
const SALT_BYTES = 16;
const KEY_LEN = 64;

const scryptAsync = promisify(scrypt);

/**
 * Deriva o hash de uma senha em texto puro. Gera salt novo a cada chamada.
 * @throws se `plain` for vazio — nunca se persiste hash de senha vazia.
 */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error("hashPassword: senha vazia não é permitida");
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scryptAsync(plain, salt, KEY_LEN)) as Buffer;
  return `${SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Verifica uma senha em texto puro contra um hash previamente armazenado.
 * Fail-closed: retorna `false` para qualquer entrada falsy ou formato inválido,
 * sem lançar exceção.
 */
export async function verifyPassword(
  plain: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!plain || !stored) return false;

  const parts = stored.split("$");
  if (parts.length !== 3) return false;

  const [scheme, saltHex, hashHex] = parts;
  if (scheme !== SCHEME || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const derived = (await scryptAsync(plain, salt, expected.length)) as Buffer;

  // timingSafeEqual exige buffers do mesmo tamanho — checa antes para não lançar.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
