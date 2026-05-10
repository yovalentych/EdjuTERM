"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import {
  savePortfolioMeta,
  upsertPublication,
  deletePublication,
  upsertConference,
  deleteConference,
  upsertAward,
  deleteAward,
} from "@/lib/portfolio";

function revalidate(locale: string, projectId: string) {
  revalidatePath(`/${locale}/app/portfolio?projectId=${projectId}`);
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export async function savePortfolioMetaAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await savePortfolioMeta(projectId, {
    fullName: (fd.get("fullName") as string) ?? "",
    educationLevel: (fd.get("educationLevel") as string) ?? "",
    specialty: (fd.get("specialty") as string) ?? "",
    educationalProgram: (fd.get("educationalProgram") as string) ?? "",
    department: (fd.get("department") as string) ?? "",
    institution: (fd.get("institution") as string) ?? "",
    studyPeriodStart: (fd.get("studyPeriodStart") as string) ?? "",
    studyPeriodEnd: (fd.get("studyPeriodEnd") as string) ?? "",
    dissertationTopic: (fd.get("dissertationTopic") as string) ?? "",
    supervisor: (fd.get("supervisor") as string) ?? "",
    supervisorTitle: (fd.get("supervisorTitle") as string) ?? "",
  }, user);
  revalidate(locale, projectId);
}

// ── Publications ──────────────────────────────────────────────────────────────

export async function addPublicationAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertPublication(projectId, {
    pubid: crypto.randomUUID(),
    pubType: (fd.get("pubType") as any) ?? "journal_indexed",
    authors: (fd.get("authors") as string) ?? "",
    title: (fd.get("title") as string) ?? "",
    journal: (fd.get("journal") as string) ?? "",
    year: Number(fd.get("year") ?? new Date().getFullYear()),
    volume: (fd.get("volume") as string) ?? "",
    issue: (fd.get("issue") as string) ?? "",
    pages: (fd.get("pages") as string) ?? "",
    doi: (fd.get("doi") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function updatePublicationAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertPublication(projectId, {
    pubid: fd.get("pubid") as string,
    pubType: (fd.get("pubType") as any) ?? "journal_indexed",
    authors: (fd.get("authors") as string) ?? "",
    title: (fd.get("title") as string) ?? "",
    journal: (fd.get("journal") as string) ?? "",
    year: Number(fd.get("year") ?? new Date().getFullYear()),
    volume: (fd.get("volume") as string) ?? "",
    issue: (fd.get("issue") as string) ?? "",
    pages: (fd.get("pages") as string) ?? "",
    doi: (fd.get("doi") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function removePublicationAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await deletePublication(projectId, fd.get("pubid") as string);
  revalidate(locale, projectId);
}

// ── Conferences ───────────────────────────────────────────────────────────────

export async function addConferenceAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertConference(projectId, {
    confid: crypto.randomUUID(),
    name: (fd.get("name") as string) ?? "",
    organizer: (fd.get("organizer") as string) ?? "",
    location: (fd.get("location") as string) ?? "",
    dateStart: (fd.get("dateStart") as string) ?? "",
    dateEnd: (fd.get("dateEnd") as string) ?? "",
    thesisTitle: (fd.get("thesisTitle") as string) ?? "",
    authors: (fd.get("authors") as string) ?? "",
    award: (fd.get("award") as string) ?? "",
    isCompetition: fd.get("isCompetition") === "true",
    competitionPlace: (fd.get("competitionPlace") as string) ?? "",
    competitionNomination: (fd.get("competitionNomination") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function updateConferenceAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertConference(projectId, {
    confid: fd.get("confid") as string,
    name: (fd.get("name") as string) ?? "",
    organizer: (fd.get("organizer") as string) ?? "",
    location: (fd.get("location") as string) ?? "",
    dateStart: (fd.get("dateStart") as string) ?? "",
    dateEnd: (fd.get("dateEnd") as string) ?? "",
    thesisTitle: (fd.get("thesisTitle") as string) ?? "",
    authors: (fd.get("authors") as string) ?? "",
    award: (fd.get("award") as string) ?? "",
    isCompetition: fd.get("isCompetition") === "true",
    competitionPlace: (fd.get("competitionPlace") as string) ?? "",
    competitionNomination: (fd.get("competitionNomination") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function removeConferenceAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await deleteConference(projectId, fd.get("confid") as string);
  revalidate(locale, projectId);
}

// ── Awards ────────────────────────────────────────────────────────────────────

export async function addAwardAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertAward(projectId, {
    awid: crypto.randomUUID(),
    title: (fd.get("title") as string) ?? "",
    issuer: (fd.get("issuer") as string) ?? "",
    date: (fd.get("date") as string) ?? "",
    description: (fd.get("description") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function updateAwardAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await upsertAward(projectId, {
    awid: fd.get("awid") as string,
    title: (fd.get("title") as string) ?? "",
    issuer: (fd.get("issuer") as string) ?? "",
    date: (fd.get("date") as string) ?? "",
    description: (fd.get("description") as string) ?? "",
    url: (fd.get("url") as string) ?? "",
    orderIndex: Number(fd.get("orderIndex") ?? 0),
  }, user);
  revalidate(locale, projectId);
}

export async function removeAwardAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const projectId = fd.get("projectId") as string;
  const locale = fd.get("locale") as string;
  await deleteAward(projectId, fd.get("awid") as string);
  revalidate(locale, projectId);
}
