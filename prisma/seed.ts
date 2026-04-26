import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("Password1!", 12);
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  // Collectives
  const foc = await prisma.user.create({
    data: {
      email: "info@foc.cat",
      password: hashedPassword,
      name: "F O C",
      type: "COLLECTIVE",
      location: "Barcelona",
      bio: "Espacio cultural independiente dedicado a la performance, el sonido y las prácticas experimentales.",
      skills: ["Programación cultural", "Infraestructura DIY", "Alojamiento de eventos"],
      preferredLanguage: "es",
      profilePhoto: "/seed/foc.jpg",
    },
  });

  const canino = await prisma.user.create({
    data: {
      email: "hola@caninofm.com",
      password: hashedPassword,
      name: "Canino FM",
      type: "COLLECTIVE",
      location: "Barcelona",
      bio: "Independent online radio focused on music and conversation outside the mainstream.",
      skills: ["Radio", "Curation", "Community building"],
      preferredLanguage: "en",
      profilePhoto: "/seed/canino.png",
    },
  });

  // Private users
  const emma = await prisma.user.create({
    data: {
      email: "emma@example.com",
      password: hashedPassword,
      name: "Emma",
      surname: "Whitfield",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "Lawyer specializing in contracts and mediation. I help people understand legal documents before signing them.",
      skills: ["Legal advice", "Mediation", "Contracts"],
      languages: ["English", "Spanish"],
      preferredLanguage: "en",
      profilePhoto: "/seed/emma.jpg",
    },
  });

  const marc = await prisma.user.create({
    data: {
      email: "marc@example.com",
      password: hashedPassword,
      name: "Marc",
      surname: "Puig",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "Veinte años de experiencia en construcción y reparaciones. Puedo ayudar con mudanzas, carpintería, fontanería y trabajo manual en general.",
      skills: ["Carpintería", "Fontanería", "Cargas pesadas"],
      languages: ["Catalán", "Español"],
      preferredLanguage: "es",
      profilePhoto: "/seed/marc.webp",
    },
  });

  const sofia = await prisma.user.create({
    data: {
      email: "sofia@example.com",
      password: hashedPassword,
      name: "Sofia",
      surname: "Romero",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "Violinista formada al conservatori amb experiència fent classes a principiants i estudiants de nivell intermedi de totes les edats.",
      skills: ["Violí", "Teoria musical", "Docència"],
      languages: ["Català", "Castellà", "Italià"],
      preferredLanguage: "ca",
      profilePhoto: "/seed/sofia.jpeg",
    },
  });

  // Posts — collective requests
  await prisma.post.create({
    data: {
      title: "Necesitamos ayuda para limpiar el almacén del espacio",
      type: "REQUEST",
      category: "MANUAL_WORK",
      description: "Buscamos a unas cuantas personas que nos echen una mano un fin de semana para vaciar el cuarto de almacenamiento. Hay años de cables, equipo viejo y materiales que hay que separar, tirar o donar. Ponemos comida y bebida para quien venga a ayudar.",
      availability: "Un fin de semana de mayo, fechas por confirmar",
      location: "Barcelona",
      tags: ["limpieza", "trabajo manual", "fin de semana", "espacio"],
      authorId: foc.id,
      urgency: "URGENT",
      createdAt: daysAgo(2),
    },
  });

  await prisma.post.create({
    data: {
      title: "Looking for someone to help with our social media",
      type: "REQUEST",
      category: "TECHNOLOGY",
      description: "We're a small online radio looking for someone to help manage our social media presence. Weekly posts, sharing our schedule, and helping us develop a more consistent visual identity. Some experience with Instagram and basic graphic design preferred.",
      availability: "A few hours a week, ongoing",
      isRemote: true,
      tags: ["social media", "instagram", "communication", "radio"],
      authorId: canino.id,
      urgency: "NORMAL",
      createdAt: daysAgo(5),
    },
  });

  // Posts — private offers
  await prisma.post.create({
    data: {
      title: "Free legal help for everyday paperwork",
      type: "OFFER",
      category: "LEGAL",
      description: "I offer free orientation on rental contracts, immigration paperwork, and other common legal documents. I can't represent you in court, but I can help you understand what you're signing and what your options are.",
      availability: "Weekday evenings",
      location: "Barcelona",
      isRemote: true,
      tags: ["legal", "contracts", "advice"],
      authorId: emma.id,
      urgency: "LOW",
      createdAt: daysAgo(8),
    },
  });

  await prisma.post.create({
    data: {
      title: "Disponible para mudanzas, reparaciones y trabajo manual",
      type: "OFFER",
      category: "MANUAL_WORK",
      description: "Puedo ayudar con mudanzas, pequeñas reparaciones, carpintería y montaje o desmontaje de muebles. Tengo herramientas propias y furgoneta para transporte. Veinte años de experiencia en construcción.",
      availability: "Fines de semana y tardes entre semana",
      location: "Barcelona",
      tags: ["mudanzas", "reparaciones", "carpintería"],
      authorId: marc.id,
      urgency: "NORMAL",
      createdAt: daysAgo(12),
    },
  });

  await prisma.post.create({
    data: {
      title: "Classes de violí per a principiants i nivell intermedi",
      type: "OFFER",
      category: "EDUCATION",
      description: "Faig classes de violí des de zero fins a nivell intermedi inicial. Obert a adults i infants. Formació al conservatori i diversos anys d'experiència fent classes. Pots portar el teu propi instrument o agafar-ne un de prestat per a la primera classe.",
      availability: "Dimarts i dijous a la tarda",
      location: "Barcelona",
      tags: ["violí", "música", "classes", "educació"],
      authorId: sofia.id,
      urgency: "NORMAL",
      createdAt: daysAgo(15),
    },
  });

  console.log("Seed data created successfully!");
  console.log("Demo accounts (all use password Password1!):");
  console.log("  info@foc.cat (Collective)");
  console.log("  hola@caninofm.com (Collective)");
  console.log("  emma@example.com (Private — legal)");
  console.log("  marc@example.com (Private — manual)");
  console.log("  sofia@example.com (Private — violin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
