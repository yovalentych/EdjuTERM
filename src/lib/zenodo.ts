import { readStoredFile } from "@/lib/file-storage";
import { updateProjectRecord } from "@/lib/repositories";
import type { ProjectRecord, SafeUser } from "@/lib/schemas";

type ZenodoDeposition = {
  id: number;
  record_id?: number;
  doi?: string;
  doi_url?: string;
  record_url?: string;
  state?: string;
  submitted?: boolean;
  title?: string;
  metadata?: {
    prereserve_doi?: {
      doi?: string;
      recid?: number;
    };
  };
  links?: {
    bucket?: string;
    html?: string;
    latest_draft_html?: string;
    publish?: string;
    self?: string;
  };
};

type ZenodoUploadedFile = {
  key?: string;
  filename?: string;
  checksum?: string;
  filesize?: number;
  size?: number;
};

type ZenodoErrorDetail = {
  field?: string;
  message?: string;
};

type ZenodoErrorBody = {
  message?: string;
  status?: number;
  errors?: ZenodoErrorDetail[];
};

const defaultApiBaseUrl = "https://sandbox.zenodo.org/api";

export function hasZenodoConfig() {
  return Boolean(process.env.ZENODO_API_TOKEN);
}

export function getZenodoConfigSummary() {
  const baseUrl = normalizedBaseUrl();

  return {
    configured: hasZenodoConfig(),
    baseUrl,
    sandbox: baseUrl.includes("sandbox.zenodo.org"),
    defaultCommunity: process.env.ZENODO_DEFAULT_COMMUNITY ?? "",
  };
}

export async function syncRecordMetadataToZenodo(
  record: ProjectRecord,
  user: SafeUser,
) {
  if (!record._id) {
    throw new Error("RECORD_ID_REQUIRED");
  }
  if (!hasZenodoConfig()) {
    throw new Error("ZENODO_API_TOKEN is not configured");
  }

  try {
    const deposition = record.zenodoDepositionId
      ? await updateDeposition(record.zenodoDepositionId, record, user)
      : await createDeposition(record, user);

    const zenodoPatch = depositionToRecordPatch(deposition);
    const doi = zenodoPatch.zenodoDoi || zenodoPatch.zenodoConceptDoi || record.doi;
    const updated = await updateProjectRecord(record._id, {
      ...zenodoPatch,
      doi,
      repository: record.repository || "Zenodo",
      zenodoSyncedAt: new Date(),
      zenodoSyncError: "",
    });

    if (!updated) {
      throw new Error("RECORD_UPDATE_FAILED");
    }

    return updated;
  } catch (error) {
    const message = sanitizeZenodoError(error);
    await updateProjectRecord(record._id, {
      zenodoSyncError: message,
      zenodoSyncedAt: new Date(),
    });
    throw new Error(message);
  }
}

export async function syncRecordFilesToZenodo(
  record: ProjectRecord,
  user: SafeUser,
) {
  if (!record._id) {
    throw new Error("RECORD_ID_REQUIRED");
  }
  if (!hasZenodoConfig()) {
    throw new Error("ZENODO_API_TOKEN is not configured");
  }

  try {
    const deposition = await ensureDraftDeposition(record, user);
    const bucketUrl = deposition.links?.bucket;

    if (!bucketUrl) {
      throw new Error("Zenodo did not return a bucket upload URL");
    }

    const assets = await buildZenodoAssets(record);

    if (assets.length === 0) {
      throw new Error("No files available for Zenodo upload");
    }
    if (assets.length > 100) {
      throw new Error("Zenodo allows up to 100 files per deposition");
    }

    await Promise.all(
      assets.map((asset) => uploadFileToBucket(bucketUrl, asset)),
    );

    const refreshed = await getDeposition(deposition.id);
    const zenodoPatch = depositionToRecordPatch(refreshed);
    const updated = await updateProjectRecord(record._id, {
      ...zenodoPatch,
      zenodoFileCount: assets.length,
      zenodoFilesSyncedAt: new Date(),
      zenodoSyncedAt: new Date(),
      zenodoSyncError: "",
    });

    if (!updated) {
      throw new Error("RECORD_UPDATE_FAILED");
    }

    return updated;
  } catch (error) {
    const message = sanitizeZenodoError(error);
    await updateProjectRecord(record._id, {
      zenodoSyncError: message,
      zenodoSyncedAt: new Date(),
    });
    throw new Error(message);
  }
}

export async function publishRecordToZenodo(
  record: ProjectRecord,
  user: SafeUser,
) {
  if (!record._id) {
    throw new Error("RECORD_ID_REQUIRED");
  }
  if (!hasZenodoConfig()) {
    throw new Error("ZENODO_API_TOKEN is not configured");
  }

  const readiness = validateZenodoPublishReadiness(record);
  if (!readiness.ready) {
    throw new Error(`Zenodo publish is not ready: ${readiness.issues.join("; ")}`);
  }

  try {
    const prepared = await syncRecordFilesToZenodo(record, user);

    if (!prepared.zenodoDepositionId) {
      throw new Error("Zenodo deposition id is missing after file sync");
    }

    const published = await zenodoRequest<ZenodoDeposition>(
      `/deposit/depositions/${prepared.zenodoDepositionId}/actions/publish`,
      {
        method: "POST",
      },
    );
    const zenodoPatch = depositionToRecordPatch(published);
    const doi = zenodoPatch.zenodoDoi || zenodoPatch.zenodoConceptDoi || prepared.doi;
    const updated = await updateProjectRecord(record._id, {
      ...zenodoPatch,
      doi,
      status: "released",
      zenodoPublishedAt: new Date(),
      zenodoSyncedAt: new Date(),
      zenodoSyncError: "",
    });

    if (!updated) {
      throw new Error("RECORD_UPDATE_FAILED");
    }

    return updated;
  } catch (error) {
    const message = sanitizeZenodoError(error);
    await updateProjectRecord(record._id, {
      zenodoSyncError: message,
      zenodoSyncedAt: new Date(),
    });
    throw new Error(message);
  }
}

/**
 * Create a new Zenodo version from an already-published record.
 *
 * Zenodo flow:
 *  1. POST /deposit/depositions/{id}/actions/newversion  → returns new draft deposition
 *  2. The new draft gets a new deposition ID + pre-reserved DOI (concept DOI stays the same)
 *  3. Files from the previous version are copied automatically (can be replaced)
 *  4. We sync the new deposition ID + new pre-reserved DOI back to the record
 *
 * After calling this, the record moves back to "draft" Zenodo state so files
 * can be updated before calling publishRecordToZenodo again.
 */
export async function createNewZenodoVersion(
  record: ProjectRecord,
  user: SafeUser,
) {
  if (!record._id) throw new Error("RECORD_ID_REQUIRED");
  if (!hasZenodoConfig()) throw new Error("ZENODO_API_TOKEN is not configured");
  if (!record.zenodoDepositionId) {
    throw new Error("Record has no Zenodo deposition — sync a draft first");
  }
  if (!record.zenodoSubmitted) {
    throw new Error("Record is not yet published on Zenodo — publish it before creating a new version");
  }

  try {
    // Step 1: trigger newversion action
    const newDraft = await zenodoRequest<ZenodoDeposition>(
      `/deposit/depositions/${record.zenodoDepositionId}/actions/newversion`,
      { method: "POST" },
    );

    if (!newDraft.id) throw new Error("Zenodo did not return a new deposition id");

    // Step 2: update metadata on the new draft
    const updated = await zenodoRequest<ZenodoDeposition>(
      `/deposit/depositions/${newDraft.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ metadata: buildZenodoMetadata(record, user) }),
      },
    );

    const patch = depositionToRecordPatch(updated);
    // New version → reset submitted flag, keep concept DOI, update version DOI
    const saved = await updateProjectRecord(record._id, {
      ...patch,
      // preserve conceptDoi from previous version so we don't overwrite with empty
      zenodoConceptDoi: record.zenodoConceptDoi || patch.zenodoConceptDoi,
      zenodoSubmitted: false,
      zenodoPublishedAt: null,
      zenodoSyncedAt: new Date(),
      zenodoSyncError: "",
    });

    if (!saved) throw new Error("RECORD_UPDATE_FAILED");
    return saved;
  } catch (error) {
    const message = sanitizeZenodoError(error);
    await updateProjectRecord(record._id, {
      zenodoSyncError: message,
      zenodoSyncedAt: new Date(),
    });
    throw new Error(message);
  }
}

/**
 * Fetch the current deposition state from Zenodo and update the record.
 * If the deposition no longer exists on Zenodo (404), all zenodo* fields are cleared.
 */
export async function checkZenodoStatus(record: ProjectRecord) {
  if (!record._id) throw new Error("RECORD_ID_REQUIRED");
  if (!hasZenodoConfig()) throw new Error("ZENODO_API_TOKEN is not configured");
  if (!record.zenodoDepositionId) throw new Error("Record has no Zenodo deposition ID");

  const token = process.env.ZENODO_API_TOKEN!;
  const url = `${normalizedBaseUrl()}/deposit/depositions/${record.zenodoDepositionId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 404 || response.status === 410) {
    // Deposition was deleted on Zenodo — clear all zenodo fields in our DB
    const updated = await updateProjectRecord(record._id, {
      zenodoDepositionId: undefined,
      zenodoRecordId: undefined,
      zenodoDoi: "",
      zenodoConceptDoi: "",
      zenodoUrl: "",
      zenodoDraftUrl: "",
      zenodoState: "",
      zenodoSubmitted: false,
      zenodoFileCount: 0,
      zenodoPublishedAt: null,
      zenodoSyncedAt: new Date(),
      zenodoSyncError: "Запис видалено на Zenodo (deposition not found). Синхронізацію скинуто.",
    });
    if (!updated) throw new Error("RECORD_UPDATE_FAILED");
    return { deleted: true, record: updated };
  }

  if (!response.ok) {
    const body = await parseZenodoError(response);
    throw new Error(`Zenodo API ${response.status}: ${body.message ?? response.statusText}`);
  }

  const deposition = (await response.json()) as ZenodoDeposition;
  const patch = depositionToRecordPatch(deposition);
  const updated = await updateProjectRecord(record._id, {
    ...patch,
    zenodoSyncedAt: new Date(),
    zenodoSyncError: "",
  });
  if (!updated) throw new Error("RECORD_UPDATE_FAILED");
  return { deleted: false, record: updated };
}

export function validateZenodoPublishReadiness(record: ProjectRecord) {
  const issues = [
    record.access !== "open" ? "access must be open" : "",
    record.processingStatus !== "published" ? "processing status must be published" : "",
    !record.title.trim() ? "title is required" : "",
    !record.summary.trim() ? "summary is required" : "",
    !record.owner.trim() ? "creator/owner is required" : "",
    !record.license.trim() ? "license is required" : "",
    record.rawDataFiles.length === 0 ? "at least one project file is required" : "",
    record.zenodoSubmitted ? "record is already submitted to Zenodo" : "",
  ].filter(Boolean);

  return {
    ready: issues.length === 0,
    issues,
  };
}

async function createDeposition(record: ProjectRecord, user: SafeUser) {
  const created = await zenodoRequest<ZenodoDeposition>("/deposit/depositions", {
    method: "POST",
    body: JSON.stringify({ metadata: buildZenodoMetadata(record, user) }),
  });

  if (!created.id) {
    throw new Error("Zenodo did not return a deposition id");
  }

  return created;
}

async function ensureDraftDeposition(record: ProjectRecord, user: SafeUser) {
  if (record.zenodoSubmitted) {
    throw new Error("Published Zenodo records cannot be modified");
  }

  return record.zenodoDepositionId
    ? await updateDeposition(record.zenodoDepositionId, record, user)
    : await createDeposition(record, user);
}

async function getDeposition(depositionId: number) {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${depositionId}`, {
    method: "GET",
  });
}

async function updateDeposition(
  depositionId: number,
  record: ProjectRecord,
  user: SafeUser,
) {
  return zenodoRequest<ZenodoDeposition>(`/deposit/depositions/${depositionId}`, {
    method: "PUT",
    body: JSON.stringify({ metadata: buildZenodoMetadata(record, user) }),
  });
}

async function zenodoRequest<T>(path: string, init: RequestInit) {
  const token = process.env.ZENODO_API_TOKEN;
  if (!token) throw new Error("ZENODO_API_TOKEN is not configured");

  const response = await fetch(`${normalizedBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await parseZenodoError(response);
    const details = body.errors
      ?.map((item) => [item.field, item.message].filter(Boolean).join(": "))
      .filter(Boolean)
      .join("; ");
    throw new Error(
      `Zenodo API ${response.status}: ${body.message ?? response.statusText}${
        details ? ` (${details})` : ""
      }`,
    );
  }

  return response.json() as Promise<T>;
}

async function uploadFileToBucket(
  bucketUrl: string,
  asset: { filename: string; body: Buffer; contentType: string },
) {
  const token = process.env.ZENODO_API_TOKEN;
  if (!token) throw new Error("ZENODO_API_TOKEN is not configured");

  const response = await fetch(`${bucketUrl}/${encodeURIComponent(asset.filename)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(asset.body.byteLength),
    },
    body: new Uint8Array(asset.body),
  });

  if (!response.ok) {
    const body = await parseZenodoError(response);
    throw new Error(`Zenodo file upload ${response.status}: ${body.message ?? response.statusText}`);
  }

  return response.json() as Promise<ZenodoUploadedFile>;
}

async function buildZenodoAssets(record: ProjectRecord) {
  const generated = [
    {
      filename: "README.md",
      body: Buffer.from(buildReadme(record), "utf8"),
      contentType: "text/markdown; charset=utf-8",
    },
    {
      filename: "metadata.json",
      body: Buffer.from(JSON.stringify(buildMetadataJson(record), null, 2), "utf8"),
      contentType: "application/json; charset=utf-8",
    },
    {
      filename: "data_dictionary.csv",
      body: Buffer.from(buildDataDictionaryCsv(record), "utf8"),
      contentType: "text/csv; charset=utf-8",
    },
  ];

  const storedFiles = await Promise.all(
    record.rawDataFiles.map(async (file, index) => ({
      filename: safeZenodoFilename(`${String(index + 1).padStart(2, "0")}-${file.name}`),
      body: await readStoredFile(file.storageUri),
      contentType: file.mimeType || "application/octet-stream",
    })),
  );

  return [...generated, ...storedFiles];
}

function buildZenodoMetadata(record: ProjectRecord, user: SafeUser) {
  const keywords = [
    ...splitKeywords(record.keywords),
    ...(record.tags ?? []),
    record.localId,
    record.stage,
    record.group,
    ...(record.subjects ?? []),
  ]
    .map((v) => v.trim())
    .filter(Boolean);

  // Build creators: use structured creators array if available, fall back to owner
  const creators = buildCreatorsMetadata(record, user);

  const accessRight = accessRightForRecord(record);

  const metadata: Record<string, unknown> = {
    title: record.title,
    upload_type: uploadTypeForRecord(record),
    publication_date: new Date().toISOString().slice(0, 10),
    description: buildDescription(record),
    creators,
    access_right: accessRight,
    keywords: Array.from(new Set(keywords)).slice(0, 50),
    version: record.version || "1.0",
    notes: [
      record.usageNotes,
      record.notes,
      record.fundingGrant ? `Funding: ${record.fundingGrant}` : "",
      record.dateCollectedFrom || record.dateCollectedTo
        ? `Data collected: ${record.dateCollectedFrom ?? "?"} — ${record.dateCollectedTo ?? "?"}`
        : "",
    ].filter(Boolean).join("\n\n") || undefined,
  };

  // License (only for open access)
  const license = normalizeLicense(record.license);
  if (license && accessRight === "open") {
    metadata.license = license;
  }

  // Embargo date
  if (accessRight === "embargoed" && record.embargoDate) {
    metadata.embargo_date = record.embargoDate;
  }

  // Language (ISO 639-1 code, e.g. "uk", "en")
  if (record.language) {
    metadata.language = record.language;
  }

  // Dates collected
  if (record.dateCollectedFrom || record.dateCollectedTo) {
    metadata.dates = [
      {
        type: "Collected",
        start: record.dateCollectedFrom || undefined,
        end: record.dateCollectedTo || undefined,
        description: "Data collection period",
      },
    ].map(removeUndefinedValues);
  }

  // Subjects (Zenodo subject objects)
  if (record.subjects && record.subjects.length > 0) {
    metadata.subjects = record.subjects.map((s) => ({ term: s }));
  }

  // Funding (OpenAIRE grant format — if looks like an OpenAIRE ID, use it)
  if (record.fundingGrant) {
    const openAireId = extractOpenAireGrantId(record.fundingGrant);
    if (openAireId) {
      metadata.grants = [{ id: openAireId }];
    }
  }

  // Contributors
  const contributors = buildContributorsMetadata(record);
  if (contributors) {
    metadata.contributors = contributors;
  }

  // References (free-text bibliography)
  const refs = (record as { references?: string }).references;
  if (refs?.trim()) {
    metadata.references = refs.trim().split("\n").map((r) => r.trim()).filter(Boolean);
  }

  // Related identifiers (DOI, URL, ISBN, etc.)
  const relatedIds = (record as { relatedIdentifiers?: Array<{ identifier: string; scheme: string; relation: string }> }).relatedIdentifiers;
  if (relatedIds && relatedIds.length > 0) {
    metadata.related_identifiers = relatedIds.map((r) => ({
      identifier: r.identifier,
      scheme: r.scheme,
      relation: r.relation,
    }));
  }

  // Community
  const community = process.env.ZENODO_DEFAULT_COMMUNITY?.trim();
  if (community) {
    metadata.communities = [{ identifier: community }];
  }

  return removeUndefinedValues(metadata);
}

function zenodoName(nativeScript: string, latinScript?: string) {
  // Zenodo requires Latin script names. Prefer explicit Latin, fall back to native.
  const latin = latinScript?.trim();
  return latin || normalizeCreatorName(nativeScript);
}

function buildCreatorsMetadata(record: ProjectRecord, user: SafeUser) {
  if (record.creators && record.creators.length > 0) {
    return record.creators.map((c) =>
      removeUndefinedValues({
        name: zenodoName(c.name, (c as { nameEn?: string }).nameEn),
        affiliation: c.affiliation || undefined,
        orcid: c.orcid || undefined,
      }),
    );
  }
  // Fall back to owner string + user profile (use Latin fields if set)
  const latinName = [user.lastNameLatin, user.firstNameLatin].filter(Boolean).join(", ");
  return [
    removeUndefinedValues({
      name: latinName || normalizeCreatorName(record.owner || userDisplayName(user)),
      affiliation: user.affiliation || undefined,
      orcid: user.orcid || undefined,
    }),
  ];
}

function buildContributorsMetadata(record: ProjectRecord) {
  const contributors = (record as { contributors?: Array<{ name: string; nameEn?: string; affiliation?: string; orcid?: string; role?: string }> }).contributors;
  if (!contributors || contributors.length === 0) return undefined;
  return contributors.map((c) =>
    removeUndefinedValues({
      name: zenodoName(c.name, c.nameEn),
      affiliation: c.affiliation || undefined,
      orcid: c.orcid || undefined,
      type: c.role || "Other",
    }),
  );
}

function extractOpenAireGrantId(value: string): string | null {
  // OpenAIRE grant IDs look like: "10.13039/501100004491::123456"
  // or just match if the string looks like an ID (contains "::")
  const trimmed = value.trim();
  if (trimmed.includes("::")) return trimmed;
  return null;
}

function buildDescription(record: ProjectRecord) {
  const lines = [
    record.summary || "Research output metadata prepared for open science publication.",
    "",
    `Local repository identifier: ${record.localId}`,
    `Record kind: ${record.kind}`,
    `Processing status: ${record.processingStatus}`,
    record.dataFormat ? `Data/software format: ${record.dataFormat}` : "",
    record.rawDataFiles.length > 0
      ? `Registered files in project system: ${record.rawDataFiles.map((file) => file.name).join(", ")}`
      : "",
    record.usageNotes ? `Usage notes: ${record.usageNotes}` : "",
  ].filter(Boolean);

  return lines.join("\n");
}

function buildReadme(record: ProjectRecord) {
  return [
    `# ${record.title}`,
    "",
    record.summary || "No summary provided.",
    "",
    "## Record metadata",
    "",
    `- Local ID: ${record.localId}`,
    `- Kind: ${record.kind}`,
    `- Stage: ${record.stage}`,
    `- Group: ${record.group || "not specified"}`,
    `- Data format: ${record.dataFormat || "not specified"}`,
    `- Version: ${record.version || "1.0"}`,
    `- Access: ${record.access}`,
    `- License: ${record.license || "not specified"}`,
    `- Processing status: ${record.processingStatus}`,
    "",
    "## Files",
    "",
    ...record.rawDataFiles.map((file) =>
      `- ${file.name} (${file.bytes ?? 0} bytes, sha256: ${file.checksum || "not recorded"})`,
    ),
    "",
    "## Usage notes",
    "",
    record.usageNotes || "No usage notes provided.",
  ].join("\n");
}

function buildMetadataJson(record: ProjectRecord) {
  return {
    localId: record.localId,
    title: record.title,
    kind: record.kind,
    stage: record.stage,
    group: record.group,
    dataFormat: record.dataFormat,
    version: record.version,
    access: record.access,
    owner: record.owner,
    repository: record.repository,
    summary: record.summary,
    usageNotes: record.usageNotes,
    keywords: splitKeywords(record.keywords),
    tags: record.tags,
    license: record.license,
    doi: record.doi,
    processingStatus: record.processingStatus,
    files: record.rawDataFiles.map((file) => ({
      name: file.name,
      checksumSha256: file.checksum,
      mimeType: file.mimeType,
      bytes: file.bytes,
      uploadedAt: file.uploadedAt,
    })),
    exportedAt: new Date().toISOString(),
  };
}

function buildDataDictionaryCsv(record: ProjectRecord) {
  const rows = [
    ["field", "value", "description"],
    ["localId", record.localId, "Local project record identifier"],
    ["title", record.title, "Record title"],
    ["kind", record.kind, "Record type"],
    ["stage", record.stage, "Project stage"],
    ["group", record.group, "Experimental or analysis group"],
    ["dataFormat", record.dataFormat, "Primary data/software format"],
    ["version", record.version, "Dataset or output version"],
    ["access", record.access, "Access category"],
    ["owner", record.owner, "Responsible creator or data owner"],
    ["repository", record.repository, "Target repository"],
    ["license", record.license, "Reuse license"],
    ["keywords", record.keywords, "Comma-separated keywords"],
    ["tags", record.tags.join("; "), "Internal tags"],
    ["processingStatus", record.processingStatus, "Lifecycle status"],
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function depositionToRecordPatch(deposition: ZenodoDeposition) {
  const prereleaseDoi = deposition.metadata?.prereserve_doi?.doi ?? "";
  const doi = deposition.doi ?? prereleaseDoi;
  const doiUrl = deposition.doi_url || (doi ? `https://doi.org/${doi}` : "");

  return {
    zenodoDepositionId: deposition.id,
    zenodoRecordId: deposition.record_id,
    zenodoConceptDoi: prereleaseDoi,
    zenodoDoi: deposition.doi ?? "",
    zenodoUrl: deposition.record_url || doiUrl,
    zenodoDraftUrl: deposition.links?.latest_draft_html || deposition.links?.html || "",
    zenodoState: deposition.state ?? "",
    zenodoSubmitted: Boolean(deposition.submitted),
  };
}

function csvCell(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function safeZenodoFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180) || "file";
}

function uploadTypeForRecord(record: ProjectRecord) {
  if (record.kind === "dataset" || record.kind === "sample") return "dataset";
  if (record.kind === "protocol") return "publication";
  if (record.kind === "output") return "software";
  return "other";
}

function accessRightForRecord(record: ProjectRecord) {
  if (record.access === "open") return "open";
  if (record.access === "embargoed") return "embargoed";
  if (record.access === "restricted") return "restricted";
  return "closed";
}

function normalizeCreatorName(value: string) {
  return value.trim() || "Project Team";
}

function userDisplayName(user: SafeUser) {
  const fullName = [user.lastName, user.firstName].filter(Boolean).join(", ");
  return fullName || user.email;
}

function splitKeywords(value: string) {
  return value
    .split(/[;,]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function normalizeLicense(value: string) {
  const license = value.trim();
  if (!license) return "";
  return license.toLowerCase();
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ""),
  );
}

function normalizedBaseUrl() {
  return (process.env.ZENODO_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, "");
}

async function parseZenodoError(response: Response): Promise<ZenodoErrorBody> {
  try {
    return (await response.json()) as ZenodoErrorBody;
  } catch {
    return { message: response.statusText, status: response.status };
  }
}

function sanitizeZenodoError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Zenodo error";
  return message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer ***").slice(0, 1200);
}
