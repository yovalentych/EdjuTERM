import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const uploadRoot = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "project-record-files");
const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024;
const DEFAULT_MAX_FILES_PER_REQUEST = 10;
const allowedExtensions = new Set([
  ".csv",
  ".tsv",
  ".txt",
  ".json",
  ".xlsx",
  ".xls",
  ".pdf",
  ".docx",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".tif",
  ".tiff",
  ".zip",
]);
const allowedMimeTypes = new Set([
  "application/csv",
  "application/json",
  "application/msword",
  "application/octet-stream",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/csv",
  "text/plain",
  "text/tab-separated-values",
]);

type StorageDriver = "local" | "r2";

export type StoredRecordFile = {
  name: string;
  storageUri: string;
  checksum: string;
  mimeType?: string;
  bytes: number;
  uploadedAt: Date;
};

export class UploadPolicyError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function getStorageDriver(): StorageDriver {
  return process.env.FILE_STORAGE_DRIVER === "r2" ? "r2" : "local";
}

function getR2Bucket() {
  return process.env.R2_BUCKET ?? "";
}

function getR2Endpoint() {
  if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return "";
}

let r2Client: S3Client | undefined;

function getR2Client() {
  const endpoint = getR2Endpoint();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey || !getR2Bucket()) {
    throw new Error("R2 storage is not configured");
  }

  r2Client ??= new S3Client({
    endpoint,
    region: process.env.R2_REGION ?? "auto",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

export function getFileStorageSummary() {
  const driver = getStorageDriver();
  return {
    driver,
    bucket: driver === "r2" ? getR2Bucket() || null : null,
    endpoint: driver === "r2" ? getR2Endpoint() || null : null,
  };
}

export async function storeRecordFiles(
  recordKey: string,
  files: File[],
  uploadedAt: Date,
): Promise<StoredRecordFile[]> {
  const validFiles = validateRecordFiles(files);

  if (validFiles.length === 0) {
    return [];
  }

  return Promise.all(
    validFiles.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      await scanFileBuffer(buffer, file);
      const checksum = createHash("sha256").update(buffer).digest("hex");
      const safeName = safeFilename(file.name || `file-${index + 1}`);
      const storageName = `${String(index + 1).padStart(2, "0")}-${Date.now()}-${safeName}`;

      if (getStorageDriver() === "r2") {
        return storeR2File({
          buffer,
          checksum,
          file,
          key: `project-record-files/${recordKey}/${storageName}`,
          name: safeName,
          uploadedAt,
        });
      }

      return storeLocalFile({
        buffer,
        checksum,
        file,
        name: safeName,
        recordKey,
        storageName,
        uploadedAt,
      });
    }),
  );
}

export function validateRecordFiles(files: File[]) {
  const validFiles = files.filter((file) => file.size > 0);
  const maxFiles = Number(process.env.RECORD_UPLOAD_MAX_FILES ?? DEFAULT_MAX_FILES_PER_REQUEST);
  const maxBytes = Number(process.env.RECORD_UPLOAD_MAX_BYTES ?? DEFAULT_MAX_FILE_BYTES);

  if (validFiles.length > maxFiles) {
    throw new UploadPolicyError("TOO_MANY_FILES", `Maximum ${maxFiles} files per request.`);
  }

  for (const file of validFiles) {
    const safeName = safeFilename(file.name || "file");
    const extension = path.extname(safeName).toLowerCase();

    if (file.size > maxBytes) {
      throw new UploadPolicyError("FILE_TOO_LARGE", `${safeName} exceeds the upload size limit.`);
    }

    if (!allowedExtensions.has(extension)) {
      throw new UploadPolicyError("FILE_EXTENSION_BLOCKED", `${safeName} has an unsupported extension.`);
    }

    if (file.type && !allowedMimeTypes.has(file.type)) {
      throw new UploadPolicyError("FILE_TYPE_BLOCKED", `${safeName} has an unsupported MIME type.`);
    }
  }

  return validFiles;
}

export async function readStoredFile(storageUri: string) {
  if (storageUri.startsWith("r2://")) {
    return readR2File(storageUri);
  }

  const absolutePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), storageUri);
  const allowedRoot = path.resolve(uploadRoot);

  if (!absolutePath.startsWith(allowedRoot)) {
    throw new Error("FORBIDDEN_STORAGE_PATH");
  }

  return readFile(absolutePath);
}

async function storeLocalFile({
  buffer,
  checksum,
  file,
  name,
  recordKey,
  storageName,
  uploadedAt,
}: {
  buffer: Buffer;
  checksum: string;
  file: File;
  name: string;
  recordKey: string;
  storageName: string;
  uploadedAt: Date;
}): Promise<StoredRecordFile> {
  const recordDir = path.join(uploadRoot, recordKey);
  await mkdir(recordDir, { recursive: true });

  const storagePath = path.join(recordDir, storageName);
  await writeFile(storagePath, buffer);

  return {
    name,
    storageUri: path.relative(/*turbopackIgnore: true*/ process.cwd(), storagePath),
    checksum,
    mimeType: file.type || undefined,
    bytes: file.size,
    uploadedAt,
  };
}

async function storeR2File({
  buffer,
  checksum,
  file,
  key,
  name,
  uploadedAt,
}: {
  buffer: Buffer;
  checksum: string;
  file: File;
  key: string;
  name: string;
  uploadedAt: Date;
}): Promise<StoredRecordFile> {
  const bucket = getR2Bucket();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentLength: file.size,
      ContentType: file.type || "application/octet-stream",
      Metadata: {
        originalName: encodeURIComponent(name),
        checksumSha256: checksum,
      },
    }),
  );

  return {
    name,
    storageUri: `r2://${bucket}/${key}`,
    checksum,
    mimeType: file.type || undefined,
    bytes: file.size,
    uploadedAt,
  };
}

async function readR2File(storageUri: string) {
  const { bucket, key } = parseR2Uri(storageUri);
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  const body = response.Body;
  if (!body) {
    throw new Error("EMPTY_STORAGE_OBJECT");
  }

  if ("transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Buffer | Uint8Array | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseR2Uri(storageUri: string) {
  const withoutProtocol = storageUri.replace(/^r2:\/\//, "");
  const slashIndex = withoutProtocol.indexOf("/");

  if (slashIndex <= 0) {
    throw new Error("INVALID_R2_URI");
  }

  return {
    bucket: withoutProtocol.slice(0, slashIndex),
    key: withoutProtocol.slice(slashIndex + 1),
  };
}

function safeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}

async function scanFileBuffer(_buffer: Buffer, file: File) {
  if (process.env.FILE_SCAN_MODE === "required" && !process.env.FILE_SCAN_PROVIDER) {
    throw new UploadPolicyError(
      "FILE_SCANNER_NOT_CONFIGURED",
      `File scanner is required before accepting ${safeFilename(file.name || "file")}.`,
    );
  }
}
