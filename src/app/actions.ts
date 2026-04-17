"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";
import { verifyPassword } from "@/lib/passwords";
import { createProjectForUser } from "@/lib/projects";
import { insertProjectRecord } from "@/lib/repositories";
import {
  loginInputSchema,
  projectInputSchema,
  projectRecordInputSchema,
  registerInputSchema,
} from "@/lib/schemas";
import { createSession, destroySession } from "@/lib/session";
import { createUser, findUserByEmail } from "@/lib/users";

function formLocale(formData: FormData) {
  const localeValue = formData.get("locale");

  return typeof localeValue === "string" && isLocale(localeValue)
    ? localeValue
    : "uk";
}

export async function createRecord(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${formLocale(formData)}/login`);
  }

  const payload = {
    kind: formData.get("kind"),
    localId: formData.get("localId"),
    title: formData.get("title"),
    stage: formData.get("stage"),
    access: formData.get("access"),
    owner: formData.get("owner") || "Unassigned",
    repository: formData.get("repository") || "tbd",
    summary: formData.get("summary") || "",
  };
  const locale = formLocale(formData);

  const record = projectRecordInputSchema.parse(payload);
  await insertProjectRecord(record);
  revalidatePath(`/${locale}/app`);
}

export async function register(formData: FormData) {
  const locale = formLocale(formData);
  const payload = registerInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    redirect(`/${locale}/register?error=invalid`);
  }

  try {
    const user = await createUser(payload.data);

    if (!user._id) {
      redirect(`/${locale}/register?error=server`);
    }

    await createSession(user._id, user.role);
  } catch (error) {
    if (error instanceof Error && error.message === "USER_EXISTS") {
      redirect(`/${locale}/register?error=exists`);
    }

    redirect(`/${locale}/register?error=server`);
  }

  redirect(`/${locale}/app`);
}

export async function login(formData: FormData) {
  const locale = formLocale(formData);
  const payload = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!payload.success) {
    redirect(`/${locale}/login?error=invalid`);
  }

  const user = await findUserByEmail(payload.data.email);

  if (!user) {
    redirect(`/${locale}/login?error=invalid`);
  }

  const isValidPassword = await verifyPassword(
    payload.data.password,
    user.passwordHash,
  );

  if (!isValidPassword || !user._id) {
    redirect(`/${locale}/login?error=invalid`);
  }

  await createSession(user._id, user.role);
  redirect(`/${locale}/app`);
}

export async function logout(formData: FormData) {
  const locale = formLocale(formData);
  await destroySession();
  redirect(`/${locale}`);
}

export async function createProject(formData: FormData) {
  const locale = formLocale(formData);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const payload = projectInputSchema.safeParse({
    title: formData.get("title"),
    acronym: formData.get("acronym"),
    summary: formData.get("summary") || "",
  });

  if (!payload.success) {
    redirect(`/${locale}/projects/new?error=invalid`);
  }

  await createProjectForUser(payload.data, user);
  revalidatePath(`/${locale}/app`);
  redirect(`/${locale}/app`);
}
