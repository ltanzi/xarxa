import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  const maria = await prisma.user.create({
    data: {
      email: "maria@example.com",
      password: hashedPassword,
      name: "Maria Garcia",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "Passionate about helping my community through translation and legal aid.",
      skills: "Translation (Catalan, Spanish, English), Legal consulting",
    },
  });

  const associacio = await prisma.user.create({
    data: {
      email: "info@associaciolliure.org",
      password: hashedPassword,
      name: "Associació Lliure",
      type: "COLLECTIVE",
      location: "Girona",
      bio: "We work to bridge the digital divide in rural communities.",
      mission: "Digital inclusion for all — providing technology training and access to underserved communities.",
    },
  });

  await prisma.post.create({
    data: {
      title: "Free legal consultation for migrants",
      type: "OFFER",
      category: "LEGAL",
      description:
        "I am a retired lawyer and can offer free legal advice on immigration procedures, residency permits, and related matters. Available for video calls or in-person in Barcelona.",
      availability: "Weekday evenings, Saturday mornings",
      location: "Barcelona",
      isRemote: true,
      tags: ["legal", "immigration", "free advice"],
      authorId: maria.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Catalan-English document translation",
      type: "OFFER",
      category: "TRANSLATION",
      description:
        "I can help translate official documents, letters, or emails between Catalan, Spanish, and English. No certified translations, but happy to help with everyday documents.",
      availability: "Flexible",
      isRemote: true,
      tags: ["catalan", "english", "spanish", "documents"],
      authorId: maria.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Volunteers needed for computer literacy workshops",
      type: "REQUEST",
      category: "TECHNOLOGY",
      description:
        "We are looking for volunteers who can teach basic computer skills (email, internet browsing, video calls) to elderly residents in Girona. Workshops are held every Saturday morning at our community center.",
      availability: "Saturdays 10:00-13:00",
      location: "Girona",
      tags: ["technology", "elderly", "workshops", "volunteering"],
      authorId: associacio.id,
    },
  });

  const post4 = await prisma.post.create({
    data: {
      title: "Looking for help building our website",
      type: "REQUEST",
      category: "TECHNOLOGY",
      description:
        "We need a simple website to showcase our activities, upcoming events, and how people can get involved. We have the content ready but lack the technical skills to build it.",
      isRemote: true,
      tags: ["web development", "nonprofit", "website"],
      authorId: associacio.id,
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: maria.id }, { id: associacio.id }],
      },
    },
  });

  await prisma.connection.create({
    data: {
      postId: post4.id,
      requesterId: maria.id,
      status: "ACCEPTED",
      conversationId: conversation.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "Hola! I saw your post about needing help with a website. I have some web development experience and would love to help!",
      conversationId: conversation.id,
      senderId: maria.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "That would be amazing! We have all the content ready — text, photos, and our logo. Can you work with WordPress or do you prefer something else?",
      conversationId: conversation.id,
      senderId: associacio.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "I usually work with simpler tools — I could set up a clean site with basic hosting. Let's schedule a call to discuss the details?",
      conversationId: conversation.id,
      senderId: maria.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log("Demo accounts:");
  console.log("  maria@example.com / password123");
  console.log("  info@associaciolliure.org / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
