import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";

// Stockage compatible "S3-like" avec un backend disque local pour le MVP.
// L'interface (buckets, upload, download, URLs signées) est conçue pour pouvoir
// être remplacée par un vrai client S3/MinIO sans changer les routes/contrôleurs.

const STORAGE_ROOT = path.join(__dirname, "..", "..", "storage-data");

function bucketPath(projectId: string, bucket: string): string {
  return path.join(STORAGE_ROOT, projectId, bucket);
}

export function ensureBucketDir(projectId: string, bucket: string) {
  fs.mkdirSync(bucketPath(projectId, bucket), { recursive: true });
}

export function saveFile(projectId: string, bucket: string, fileName: string, buffer: Buffer) {
  ensureBucketDir(projectId, bucket);
  const safeName = path.basename(fileName);
  fs.writeFileSync(path.join(bucketPath(projectId, bucket), safeName), buffer);
  return safeName;
}

export function readFile(projectId: string, bucket: string, fileName: string): Buffer {
  const safeName = path.basename(fileName);
  return fs.readFileSync(path.join(bucketPath(projectId, bucket), safeName));
}

export function deleteFile(projectId: string, bucket: string, fileName: string) {
  const safeName = path.basename(fileName);
  const p = path.join(bucketPath(projectId, bucket), safeName);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function listFiles(projectId: string, bucket: string): string[] {
  const dir = bucketPath(projectId, bucket);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

// URL signée à durée limitée pour les fichiers de buckets privés.
export function generateSignedUrl(projectId: string, bucket: string, fileName: string, expiresInSeconds = 3600) {
  const expires = Date.now() + expiresInSeconds * 1000;
  const payload = `${projectId}:${bucket}:${fileName}:${expires}`;
  const signature = crypto.createHmac("sha256", env.jwtSecret).update(payload).digest("hex");
  return `${env.apiPublicUrl}/api/projects/${projectId}/storage/${bucket}/${fileName}?expires=${expires}&signature=${signature}`;
}

export function verifySignedUrl(projectId: string, bucket: string, fileName: string, expires: string, signature: string): boolean {
  if (Date.now() > parseInt(expires, 10)) return false;
  const payload = `${projectId}:${bucket}:${fileName}:${expires}`;
  const expected = crypto.createHmac("sha256", env.jwtSecret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
