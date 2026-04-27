import "dotenv/config";

import { Role } from "../src/generated/prisma/enums";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const getDatabaseUrl = (): string => {
  const directUrl = process.env.DIRECT_URL;
  const pooledUrl = process.env.DATABASE_URL;

  if (directUrl) {
    return directUrl;
  }

  if (pooledUrl) {
    return pooledUrl;
  }

  throw new Error("DIRECT_URL or DATABASE_URL is required for seeding.");
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getDatabaseUrl(),
  }),
});

const propertiesSeedData = [
  {
    title: "Apartamento panoramico en El Poblado",
    description:
      "Apartamento de dos habitaciones con balcon amplio, estudio y vista a la ciudad.",
    price: 4200000,
    location: "Medellin - El Poblado",
    rooms: 2,
  },
  {
    title: "Casa familiar en Envigado",
    description:
      "Casa en unidad cerrada con patio interno, parqueadero doble y zona social.",
    price: 5600000,
    location: "Envigado - Loma del Escobero",
    rooms: 4,
  },
  {
    title: "Apartaestudio moderno en Sabaneta",
    description:
      "Apartaestudio tipo loft, ideal para profesionales, cercano al metro y comercio.",
    price: 2100000,
    location: "Sabaneta - Aves Maria",
    rooms: 1,
  },
  {
    title: "Apartamento renovado en Laureles",
    description:
      "Apartamento de tres habitaciones, cocina abierta y excelente iluminacion natural.",
    price: 3500000,
    location: "Medellin - Laureles",
    rooms: 3,
  },
  {
    title: "Casa campestre urbana en Bello",
    description:
      "Casa amplia con terraza, zona BBQ y acceso rapido a transporte publico.",
    price: 3900000,
    location: "Bello - Cabañas",
    rooms: 3,
  },
  {
    title: "Apartamento pet friendly en Belen",
    description:
      "Apartamento con balcon, parqueadero cubierto y amenidades para mascotas.",
    price: 2800000,
    location: "Medellin - Belen",
    rooms: 2,
  },
  {
    title: "Duplex premium en El Tesoro",
    description:
      "Duplex de lujo con acabados de alta gama, terraza privada y vista verde.",
    price: 7900000,
    location: "Medellin - El Tesoro",
    rooms: 3,
  },
  {
    title: "Apartamento funcional en Itagui",
    description:
      "Apartamento de dos habitaciones, cerca a centros comerciales y rutas de bus.",
    price: 2400000,
    location: "Itagui - Suramerica",
    rooms: 2,
  },
  {
    title: "Casa tradicional en La Estrella",
    description:
      "Casa de dos niveles con jardin frontal y excelente ventilacion cruzada.",
    price: 3300000,
    location: "La Estrella - Centro",
    rooms: 3,
  },
  {
    title: "Apartamento ejecutivo en Ciudad del Rio",
    description:
      "Apartamento amoblable con zona de coworking, gimnasio y vigilancia 24/7.",
    price: 4600000,
    location: "Medellin - Ciudad del Rio",
    rooms: 2,
  },
] as const;

const usersSeedData = [
  {
    email: "seed.owner@rentvago.com",
    password: "RentVagoSeed123",
    role: Role.ADMIN,
  },
  {
    email: "seed.manager@rentvago.com",
    password: "RentVagoManager123",
    role: Role.MANAGER,
  },
  {
    email: "seed.analyst@rentvago.com",
    password: "RentVagoUser123",
    role: Role.EMPLOYEE,
  },
  {
    email: "seed.agent1@rentvago.com",
    password: "RentVagoUser123",
    role: Role.EMPLOYEE,
  },
  {
    email: "seed.agent2@rentvago.com",
    password: "RentVagoUser123",
    role: Role.EMPLOYEE,
  },
] as const;

async function main(): Promise<void> {
  const userRecords = await Promise.all(
    usersSeedData.map(async (seedUser) => {
      const passwordHash = await bcrypt.hash(seedUser.password, 12);

      const user = await prisma.user.upsert({
        where: {
          email: seedUser.email,
        },
        update: {
          passwordHash,
          role: seedUser.role,
        },
        create: {
          email: seedUser.email,
          passwordHash,
          role: seedUser.role,
        },
        select: {
          id: true,
          email: true,
        },
      });

      return user;
    }),
  );

  const owner = userRecords.find(
    (user) => user.email === "seed.owner@rentvago.com",
  );

  if (!owner) {
    throw new Error("Seed owner user not found after user upserts.");
  }

  await prisma.property.deleteMany();

  await prisma.property.createMany({
    data: propertiesSeedData.map((property) => ({
      ...property,
      ownerId: owner.id,
    })),
  });

  console.log(
    `Seed completed: ${userRecords.length} users and ${propertiesSeedData.length} properties inserted.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
