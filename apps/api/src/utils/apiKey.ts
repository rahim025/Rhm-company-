import crypto from "crypto";
import { nanoid } from "nanoid";

// Une clé API complète n'est JAMAIS stockée en clair : on stocke seulement
// son préfixe (affichable) et le hash SHA-256 de la clé entière.
// La clé complète n'est montrée à l'utilisateur qu'une seule fois, à la création.

export function generateApiKey(type: "PUBLIC" | "SECRET"): { fullKey: string; prefix: string; keyHash: string } {
  const tag = type === "PUBLIC" ? "rhm_pub" : "rhm_sec";
  const secretPart = nanoid(32);
  const fullKey = `${tag}_${secretPart}`;
  const prefix = fullKey.slice(0, tag.length + 9); // tag + "_" + 8 premiers caractères visibles
  const keyHash = hashApiKey(fullKey);
  return { fullKey, prefix, keyHash };
}

export function hashApiKey(fullKey: string): string {
  return crypto.createHash("sha256").update(fullKey).digest("hex");
}
