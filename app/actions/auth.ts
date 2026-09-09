"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, SESSION_DURATION_SECONDS, createSessionToken } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") || "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return {
      error: "La aplicación no está configurada (falta APP_PASSWORD). Contacta a quien la administra.",
    };
  }

  if (!password) {
    return { error: "Ingresa la contraseña." };
  }

  if (password !== expected) {
    return { error: "Contraseña incorrecta. Intenta de nuevo." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });

  redirect("/");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
