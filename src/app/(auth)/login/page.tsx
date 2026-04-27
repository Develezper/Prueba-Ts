"use client";

import {
  buildAuthPageHref,
  DEFAULT_POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from "@/lib/auth-redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

interface LoginFormState {
  email: string;
  password: string;
}

const extractErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }
  } catch {
    return fallback;
  }

  return fallback;
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const redirectPath =
    sanitizePostAuthRedirect(searchParams.get("next")) ??
    DEFAULT_POST_AUTH_REDIRECT_PATH;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (response.status === 200) {
        router.replace(redirectPath);
        return;
      }

      if (response.status === 401) {
        setErrorMessage("Credenciales inválidas. Verifica tu correo y contraseña.");
        return;
      }

      if (response.status === 400) {
        const message = await extractErrorMessage(
          response,
          "Datos inválidos. Revisa los campos del formulario.",
        );
        setErrorMessage(message);
        return;
      }

      const message = await extractErrorMessage(
        response,
        "No pudimos iniciar sesión. Intenta de nuevo.",
      );
      setErrorMessage(message);
    } catch {
      setErrorMessage("Error de red. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-zinc-100 via-slate-50 to-white px-4 py-8 text-zinc-900 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-6 text-2xl font-extrabold uppercase leading-none tracking-[0.3em] text-emerald-700 sm:text-3xl">
            RentVago
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Inicia sesión para gestionar propiedades y residentes.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-xl shadow-zinc-200/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={form.email}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                placeholder="••••••••"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isLoading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            ¿Aún no tienes cuenta?{" "}
            <Link
              href={buildAuthPageHref("/register", redirectPath)}
              className="font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
