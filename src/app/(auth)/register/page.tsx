"use client";

import {
  buildAuthPageHref,
  DEFAULT_POST_AUTH_REDIRECT_PATH,
  sanitizePostAuthRedirect,
} from "@/lib/auth-redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
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

    if (
      typeof data === "object" &&
      data !== null &&
      "issues" in data &&
      Array.isArray(data.issues)
    ) {
      const firstIssue = data.issues[0];

      if (
        typeof firstIssue === "object" &&
        firstIssue !== null &&
        "message" in firstIssue &&
        typeof firstIssue.message === "string"
      ) {
        return firstIssue.message;
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
};

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const redirectPath =
    sanitizePostAuthRedirect(searchParams.get("next")) ??
    DEFAULT_POST_AUTH_REDIRECT_PATH;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
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

      if (response.status === 200 || response.status === 201) {
        router.replace(redirectPath);
        return;
      }

      if (response.status === 400) {
        const message = await extractErrorMessage(
          response,
          "Datos inválidos. Verifica la información del formulario.",
        );
        setErrorMessage(message);
        return;
      }

      if (response.status === 401) {
        setErrorMessage("No autorizado. Intenta iniciar sesión.");
        return;
      }

      const message = await extractErrorMessage(
        response,
        "No pudimos completar el registro. Intenta de nuevo.",
      );
      setErrorMessage(message);
    } catch {
      setErrorMessage("Error de red. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-100 via-amber-50/50 to-white px-4 py-12 text-zinc-900">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-6 text-2xl font-extrabold uppercase leading-none tracking-[0.3em] text-amber-700 sm:text-3xl">
            RentVago
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Regístrate para administrar inmuebles y operaciones en un solo lugar.
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
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
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
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-zinc-700"
              >
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                disabled={isLoading}
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    confirmPassword: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                placeholder="Repite tu contraseña"
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
              className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
            >
              {isLoading ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              href={buildAuthPageHref("/login", redirectPath)}
              className="font-semibold text-amber-700 transition hover:text-amber-800"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
