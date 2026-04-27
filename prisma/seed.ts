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

const usersSeedData = [
  {
    email: "seed.owner@rentvago.com",
    password: "RentVagoSeed123",
    role: Role.ADMIN,
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

type PropertyCatalogEntry = {
  propertyType: "Apartamento" | "Casa";
  descriptor: string;
  city: string;
  sector: string;
  feature: string;
  imageUrl: string;
  price: number;
  rooms: number;
};

const describeRooms = (rooms: number): string =>
  `${rooms} ${rooms === 1 ? "habitacion" : "habitaciones"}`;

const buildPropertyDescription = ({
  propertyType,
  rooms,
  feature,
  sector,
  city,
}: PropertyCatalogEntry): string =>
  `${propertyType} de ${describeRooms(rooms)} con ${feature}, ubicado en ${sector}, ${city}.`;

const apartmentCatalog: PropertyCatalogEntry[] = [
  {
    propertyType: "Apartamento",
    descriptor: "panoramico",
    city: "Medellin",
    sector: "El Poblado",
    feature: "balcon amplio, estudio y vista a la ciudad",
    imageUrl:
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4200000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "moderno",
    city: "Sabaneta",
    sector: "Aves Maria",
    feature: "cocina integral, nicho de oficina y acceso rapido al metro",
    imageUrl:
      "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2100000,
    rooms: 1,
  },
  {
    propertyType: "Apartamento",
    descriptor: "renovado",
    city: "Medellin",
    sector: "Laureles",
    feature: "cocina abierta, comedor amplio e iluminacion natural",
    imageUrl:
      "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3500000,
    rooms: 3,
  },
  {
    propertyType: "Apartamento",
    descriptor: "pet friendly",
    city: "Medellin",
    sector: "Belen",
    feature: "balcon, parqueadero cubierto y amenidades para mascotas",
    imageUrl:
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2800000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "ejecutivo",
    city: "Medellin",
    sector: "Ciudad del Rio",
    feature: "coworking, gimnasio y vigilancia 24/7",
    imageUrl:
      "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4600000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "familiar",
    city: "Envigado",
    sector: "Loma del Chocho",
    feature: "estudio, dos banos y vista a reserva natural",
    imageUrl:
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3900000,
    rooms: 3,
  },
  {
    propertyType: "Apartamento",
    descriptor: "tipo loft",
    city: "Medellin",
    sector: "Manila",
    feature: "doble altura, cocina abierta y zona social integrada",
    imageUrl:
      "https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2600000,
    rooms: 1,
  },
  {
    propertyType: "Apartamento",
    descriptor: "con terraza",
    city: "Medellin",
    sector: "Calasanz",
    feature: "terraza privada, zona BBQ y cuarto util",
    imageUrl:
      "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3300000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "iluminado",
    city: "Itagui",
    sector: "Suramerica",
    feature: "vista abierta, club house y parqueadero privado",
    imageUrl:
      "https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2400000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "de lujo",
    city: "Medellin",
    sector: "El Tesoro",
    feature: "acabados premium, domotica y ventanales de piso a techo",
    imageUrl:
      "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 7900000,
    rooms: 3,
  },
  {
    propertyType: "Apartamento",
    descriptor: "central",
    city: "Medellin",
    sector: "Estadio",
    feature: "cercania al metro, balcon y cocina remodelada",
    imageUrl:
      "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2300000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "universitario",
    city: "Medellin",
    sector: "Robledo",
    feature: "escritorio integrado, rutas cercanas y porteria",
    imageUrl:
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 1800000,
    rooms: 1,
  },
  {
    propertyType: "Apartamento",
    descriptor: "contemporaneo",
    city: "Bello",
    sector: "Niquia",
    feature: "cocina abierta, unidad completa y excelente ventilacion",
    imageUrl:
      "https://images.pexels.com/photos/276671/pexels-photo-276671.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2200000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "con vista verde",
    city: "Rionegro",
    sector: "Llanogrande",
    feature: "ventanales amplios, deposito y acabados sobrios",
    imageUrl:
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4100000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "minimalista",
    city: "Bogota",
    sector: "Cedritos",
    feature: "estudio privado, balcon y gimnasio en torre",
    imageUrl:
      "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3200000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "amoblable",
    city: "Cali",
    sector: "Ciudad Jardin",
    feature: "lobby elegante, piscina y distribucion abierta",
    imageUrl:
      "https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3000000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "reformado",
    city: "Barranquilla",
    sector: "Alto Prado",
    feature: "sala amplia, cocina moderna y aire central",
    imageUrl:
      "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3400000,
    rooms: 3,
  },
  {
    propertyType: "Apartamento",
    descriptor: "residencial",
    city: "Pereira",
    sector: "Pinares",
    feature: "balcon corrido, parqueadero y zona infantil",
    imageUrl:
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2700000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "esquinero",
    city: "Bucaramanga",
    sector: "Cabecera",
    feature: "ventilacion cruzada, balcon y vista urbana",
    imageUrl:
      "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2600000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "smart",
    city: "Medellin",
    sector: "Conquistadores",
    feature: "cerradura digital, nicho de oficina y balcon frances",
    imageUrl:
      "https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3100000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "acogedor",
    city: "Medellin",
    sector: "Belen Rosales",
    feature: "patio de ropas, comedor integrado y buena iluminacion",
    imageUrl:
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2500000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "exclusivo",
    city: "Bogota",
    sector: "Chico",
    feature: "acabados de alta gama, terraza social y lobby tipo hotel",
    imageUrl:
      "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5200000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "campestre",
    city: "Armenia",
    sector: "Norte",
    feature: "balcon, vista a la cordillera y distribucion fresca",
    imageUrl:
      "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2300000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "cerca al parque",
    city: "Envigado",
    sector: "Alcala",
    feature: "ascensor, zona infantil y excelente caminabilidad",
    imageUrl:
      "https://images.pexels.com/photos/276671/pexels-photo-276671.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2950000,
    rooms: 2,
  },
  {
    propertyType: "Apartamento",
    descriptor: "premium",
    city: "Cartagena",
    sector: "Cabrero",
    feature: "balcon al mar, rooftop y amenidades resort",
    imageUrl:
      "https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 6100000,
    rooms: 2,
  },
];

const houseCatalog: PropertyCatalogEntry[] = [
  {
    propertyType: "Casa",
    descriptor: "familiar",
    city: "Envigado",
    sector: "Loma del Escobero",
    feature: "patio interno, parqueadero doble y zona social",
    imageUrl:
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5600000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "campestre urbana",
    city: "Bello",
    sector: "Cabanas",
    feature: "terraza, zona BBQ y acceso rapido a transporte publico",
    imageUrl:
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3900000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "tradicional",
    city: "La Estrella",
    sector: "Centro",
    feature: "jardin frontal y excelente ventilacion cruzada",
    imageUrl:
      "https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3300000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "esquinera",
    city: "Medellin",
    sector: "San Lucas",
    feature: "estudio privado, pergola y garaje cubierto",
    imageUrl:
      "https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 6800000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "moderna",
    city: "Sabaneta",
    sector: "San Jose",
    feature: "cocina isla, estar de TV y patio posterior",
    imageUrl:
      "https://images.pexels.com/photos/209315/pexels-photo-209315.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4500000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "con jardin",
    city: "Rionegro",
    sector: "San Antonio",
    feature: "lote amplio, chimenea y comedor independiente",
    imageUrl:
      "https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 7200000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "bifamiliar",
    city: "Itagui",
    sector: "Santa Maria",
    feature: "dos niveles, patio cubierto y sala comedor amplia",
    imageUrl:
      "https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3100000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "remodelada",
    city: "Medellin",
    sector: "Los Colores",
    feature: "biblioteca, garaje electrico y patio de ropas",
    imageUrl:
      "https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5100000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "colonial",
    city: "Marinilla",
    sector: "Centro",
    feature: "corredores amplios, patio central y cocina grande",
    imageUrl:
      "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3600000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "residencial",
    city: "Bogota",
    sector: "Colina",
    feature: "estudio, deposito y altillo iluminado",
    imageUrl:
      "https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5900000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "adosada",
    city: "Cali",
    sector: "Pance",
    feature: "terraza posterior, cuarto util y conjunto cerrado",
    imageUrl:
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4700000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "de descanso",
    city: "Santa Fe de Antioquia",
    sector: "El Llano",
    feature: "piscina privada, kiosco y terraza sombreada",
    imageUrl:
      "https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 8800000,
    rooms: 5,
  },
  {
    propertyType: "Casa",
    descriptor: "iluminada",
    city: "Medellin",
    sector: "Belen Malibu",
    feature: "sala doble altura, patio y cocina remodelada",
    imageUrl:
      "https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4300000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "en unidad cerrada",
    city: "Envigado",
    sector: "Cumbres",
    feature: "family room, jardin y porteria permanente",
    imageUrl:
      "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 7600000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "cerca al metro",
    city: "Bello",
    sector: "Perez",
    feature: "garaje, patio de ropas y acceso peatonal comodo",
    imageUrl:
      "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 2800000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "campestre",
    city: "La Ceja",
    sector: "San Cayetano",
    feature: "huerta, corredor exterior y lote independiente",
    imageUrl:
      "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5400000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "fresca",
    city: "Barranquilla",
    sector: "Villa Santos",
    feature: "terraza, cuarto de servicio y patio ventilado",
    imageUrl:
      "https://images.pexels.com/photos/164522/pexels-photo-164522.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5200000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "de autor",
    city: "Pereira",
    sector: "Cerritos",
    feature: "ventanales, deck en madera y estudio independiente",
    imageUrl:
      "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 6900000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "amplia",
    city: "Bucaramanga",
    sector: "Lagos del Cacique",
    feature: "estar familiar, balcon interior y cocina generosa",
    imageUrl:
      "https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4800000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "de ladrillo",
    city: "Medellin",
    sector: "Laureles",
    feature: "patio interior, biblioteca y garaje doble",
    imageUrl:
      "https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 5700000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "suburbana",
    city: "Chia",
    sector: "Hacienda Fontanar",
    feature: "jardin grande, deposito y sala con chimenea",
    imageUrl:
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 6400000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "mediterranea",
    city: "Cartagena",
    sector: "Serena del Mar",
    feature: "terraza mirador, jacuzzi y acabados claros",
    imageUrl:
      "https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 9300000,
    rooms: 5,
  },
  {
    propertyType: "Casa",
    descriptor: "funcional",
    city: "Manizales",
    sector: "Palermo",
    feature: "cocina cerrada, estudio y patio cubierto",
    imageUrl:
      "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 3500000,
    rooms: 3,
  },
  {
    propertyType: "Casa",
    descriptor: "con rooftop",
    city: "Medellin",
    sector: "Castropol",
    feature: "terraza superior, BBQ y sala abierta",
    imageUrl:
      "https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 7100000,
    rooms: 4,
  },
  {
    propertyType: "Casa",
    descriptor: "serena",
    city: "Jamundi",
    sector: "Alfaguara",
    feature: "jardin lateral, sala abierta y zona verde privada",
    imageUrl:
      "https://images.pexels.com/photos/210617/pexels-photo-210617.jpeg?auto=compress&cs=tinysrgb&w=1600",
    price: 4100000,
    rooms: 3,
  },
];

const propertiesSeedData = [...apartmentCatalog, ...houseCatalog].map(
  ({ propertyType, descriptor, city, sector, feature, imageUrl, price, rooms }) => ({
    title: `${propertyType} ${descriptor} en ${sector}`,
    description: buildPropertyDescription({
      propertyType,
      descriptor,
      city,
      sector,
      feature,
      imageUrl,
      price,
      rooms,
    }),
    imageUrl,
    price,
    location: `${city} - ${sector}`,
    rooms,
  }),
);

if (propertiesSeedData.length !== 50) {
  throw new Error(
    `Seed data must contain exactly 50 properties. Received ${propertiesSeedData.length}.`,
  );
}

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
