import Link from "next/link";
import { cookies } from "next/headers";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { verifyAccessToken } from "@/lib/jwt";
import { favoriteService } from "@/services/favorite.service";
import { propertyService } from "@/services/property.service";

interface PropertyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const currencyFormat = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const ACCESS_COOKIE_NAME = "access_token";

const getAuthenticatedUserId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyAccessToken(accessToken);
    return payload.sub;
  } catch {
    return null;
  }
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await propertyService.getPropertyById(id);
  const userId = await getAuthenticatedUserId();
  const isFavorite =
    userId !== null
      ? await favoriteService.isPropertyFavorite(userId, id)
      : false;

  if (!property) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Propiedad no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          No existe una propiedad asociada al identificador solicitado.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Volver a la busqueda
        </Link>
      </div>
    );
  }

  const monthlyPrice = currencyFormat.format(Number(property.price));
  const estimatedBathrooms = Math.max(1, Math.floor(property.rooms / 2) + 1);
  const estimatedArea = property.rooms * 28 + 24;
  const whatsappText = encodeURIComponent(
    `Hola, me interesa la propiedad "${property.title}" (${property.location}).`,
  );
  const whatsappUrl = `https://wa.me/573001112233?text=${whatsappText}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Volver
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
          Detalle de propiedad
        </p>
      </div>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{property.location}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {property.title}
            </h1>
            <p className="mt-3 text-2xl font-bold text-emerald-700">
              {monthlyPrice}
              <span className="ml-2 text-sm font-medium text-slate-500">/ mes</span>
            </p>
          </div>
          <FavoriteButton propertyId={property.id} initialIsFavorite={isFavorite} />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <div className="h-72 rounded-3xl bg-gradient-to-br from-emerald-200 via-teal-100 to-slate-100 sm:h-96" />
            <div className="grid gap-3 sm:grid-rows-2">
              <div className="h-36 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-white sm:h-auto" />
              <div className="h-36 rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-white sm:h-auto" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Habitaciones
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {property.rooms}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Banos
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {estimatedBathrooms}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Area
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {estimatedArea} m2
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                Ubicacion
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {property.location}
              </p>
            </div>
          </div>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Descripcion
            </h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
              {property.description}
            </p>
          </article>
        </section>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-24">
          <p className="text-sm font-medium text-slate-500">Asesoria inmediata</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Agenda tu visita
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Nuestro equipo te acompana en el proceso de arriendo con atencion
            personalizada.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Contactar por WhatsApp
          </a>
        </aside>
      </div>
    </div>
  );
}
