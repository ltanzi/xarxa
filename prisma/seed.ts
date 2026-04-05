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

  const hashedPassword = await bcrypt.hash("password123", 12);

  const maria = await prisma.user.create({
    data: {
      email: "maria@example.com",
      password: hashedPassword,
      name: "Maria",
      surname: "Garcia",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "Retired lawyer. I now spend my time translating things nobody asked me to translate and giving unsolicited legal advice at family dinners.",
      skills: ["Translation", "Legal advice", "Overthinking"],
      languages: ["Catalan", "Spanish", "English"],
      preferredLanguage: "ca",
    },
  });

  const associacio = await prisma.user.create({
    data: {
      email: "info@associaciolliure.org",
      password: hashedPassword,
      name: "Associació Lliure",
      type: "COLLECTIVE",
      location: "Girona",
      bio: "We bridge the digital divide. Mostly by explaining what a PDF is, over and over.",
      mission: "Digital inclusion for all — because everyone deserves the right to accidentally reply-all.",
      skills: ["Workshops", "Tech support", "Patience"],
    },
  });

  const pau = await prisma.user.create({
    data: {
      email: "pau@example.com",
      password: hashedPassword,
      name: "Pau",
      surname: "Riera",
      type: "PRIVATE",
      location: "Tarragona",
      bio: "Amateur astronomer and professional procrastinator. I can fix your bicycle or explain why Pluto deserved better.",
      skills: ["Bicycle repair", "Stargazing", "Existential debates"],
      languages: ["Catalan", "Spanish"],
      preferredLanguage: "es",
    },
  });

  const laia = await prisma.user.create({
    data: {
      email: "laia@example.com",
      password: hashedPassword,
      name: "Laia",
      surname: "Font",
      type: "PRIVATE",
      location: "Barcelona",
      bio: "I make sourdough, knit scarves nobody wears, and know far too much about mushrooms.",
      skills: ["Baking", "Knitting", "Mycology"],
      languages: ["Catalan", "English", "French"],
      preferredLanguage: "en",
    },
  });

  const colectiu = await prisma.user.create({
    data: {
      email: "hola@colectiuverd.cat",
      password: hashedPassword,
      name: "Col·lectiu Verd",
      type: "COLLECTIVE",
      location: "Vic",
      bio: "Urban gardening collective. We turn abandoned lots into places where tomatoes can fulfill their destiny.",
      mission: "More green, less concrete. One guerrilla planter at a time.",
      skills: ["Gardening", "Composting", "Mild trespassing"],
    },
  });

  // Maria's posts
  await prisma.post.create({
    data: {
      title: "I will translate your bureaucratic nightmares",
      type: "OFFER",
      category: "TRANSLATION",
      description: "Catalan, Spanish, English — I'll translate your documents, letters, or that email from the tax office that's been sitting unopened for three weeks. No certified translations, but I promise to capture the original tone of institutional indifference.",
      availability: "Flexible, but not before 10am",
      isRemote: true,
      tags: ["translation", "catalan", "documents", "bureaucracy"],
      authorId: maria.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Free legal advice (non-binding, like my New Year's resolutions)",
      type: "OFFER",
      category: "LEGAL",
      description: "Retired lawyer offering help with immigration procedures, rental contracts, and general 'is this legal?' questions. I can't represent you in court anymore, but I can tell you with great confidence whether you should be worried.",
      availability: "Weekday evenings",
      location: "Barcelona",
      isRemote: true,
      tags: ["legal", "immigration", "contracts"],
      authorId: maria.id,
    },
  });

  // Pau's posts
  await prisma.post.create({
    data: {
      title: "Bicycle repair — I'll fix what you broke",
      type: "OFFER",
      category: "MANUAL_WORK",
      description: "Flat tires, broken chains, brakes that scream. Bring your bike and I'll sort it out. I have tools and spare parts. I draw the line at those electric scooters though — some things are beyond saving.",
      availability: "Weekends",
      location: "Tarragona",
      tags: ["bicycle", "repair", "mechanics"],
      authorId: pau.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Looking for someone to fly to the moon with",
      type: "REQUEST",
      category: "OTHER",
      description: "Not literally. I have a decent telescope and I'm looking for someone to share late-night stargazing sessions. I'll point out constellations, you bring snacks. Bonus points if you can explain why we're here.",
      availability: "Clear nights",
      location: "Tarragona",
      tags: ["astronomy", "stargazing", "existentialism"],
      authorId: pau.id,
    },
  });

  // Laia's posts
  await prisma.post.create({
    data: {
      title: "Will teach you to bake bread that actually rises",
      type: "OFFER",
      category: "EDUCATION",
      description: "After three years of failed sourdough and one incident that required repainting the kitchen ceiling, I finally know what I'm doing. I'll teach you the basics — flour, water, patience, and the courage to open the oven.",
      availability: "Saturday afternoons",
      location: "Barcelona",
      tags: ["baking", "sourdough", "bread"],
      authorId: laia.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Need someone to identify if this mushroom will kill me",
      type: "REQUEST",
      category: "HEALTH",
      description: "Just kidding — I'm the one who can identify them. If you go foraging and come back with a basket of mystery fungi, I'll tell you which ones are dinner and which ones are a terrible idea. Free of charge, photos welcome.",
      availability: "Autumn weekends, or anytime with photos",
      isRemote: true,
      tags: ["mushrooms", "foraging", "mycology", "nature"],
      authorId: laia.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Knitting circle — scarves for everyone, whether you want one or not",
      type: "OFFER",
      category: "OTHER",
      description: "I knit. A lot. I have more scarves than friends to give them to. Join me for a weekly knitting session — I'll teach beginners, chat with experts, and we'll collectively produce enough knitwear to survive a Catalan winter (which, admittedly, barely requires a jacket).",
      availability: "Thursday evenings",
      location: "Barcelona",
      tags: ["knitting", "crafts", "community"],
      authorId: laia.id,
    },
  });

  // Associació Lliure's posts
  await prisma.post.create({
    data: {
      title: "Volunteers needed: teaching grandparents to video call",
      type: "REQUEST",
      category: "TECHNOLOGY",
      description: "We run Saturday workshops for elderly residents who want to learn basic tech skills. Email, video calls, not accidentally sharing their location with the entire contact list. Patience required. Sense of humor essential.",
      availability: "Saturdays 10:00-13:00",
      location: "Girona",
      tags: ["technology", "elderly", "workshops", "volunteering"],
      authorId: associacio.id,
    },
  });

  const post_website = await prisma.post.create({
    data: {
      title: "Help us build a website (ours looks like it's from 1998)",
      type: "REQUEST",
      category: "TECHNOLOGY",
      description: "We need a simple website to show what we do, when our next events are, and how to join. Our current 'web presence' is a Facebook page run by someone who retired in 2019. We have content and photos — we just need someone who knows what a CSS is.",
      isRemote: true,
      tags: ["web development", "nonprofit", "website"],
      authorId: associacio.id,
    },
  });

  // Col·lectiu Verd's posts
  await prisma.post.create({
    data: {
      title: "Adopt a tomato plant (they need love too)",
      type: "OFFER",
      category: "OTHER",
      description: "We have more seedlings than garden space. Take home a tomato, pepper, or basil plant. We'll teach you how not to kill it. No judgment if you do — we've all been there.",
      availability: "Weekends at the garden",
      location: "Vic",
      tags: ["gardening", "plants", "urban garden"],
      authorId: colectiu.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Seeking hands that don't mind dirt",
      type: "REQUEST",
      category: "MANUAL_WORK",
      description: "We're transforming an empty lot into a community garden. We need people willing to dig, plant, water, and occasionally argue about the correct way to stake a tomato. All skill levels welcome. The soil doesn't judge.",
      availability: "Saturday mornings",
      location: "Vic",
      tags: ["gardening", "community", "volunteering", "manual work"],
      authorId: colectiu.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Composting workshop — glamorous, we know",
      type: "OFFER",
      category: "EDUCATION",
      description: "Learn to turn your kitchen scraps into actual soil. It's slower than you think, smellier than you'd hope, and more satisfying than it has any right to be. Bring gloves.",
      availability: "First Sunday of each month",
      location: "Vic",
      tags: ["composting", "workshop", "sustainability"],
      authorId: colectiu.id,
    },
  });

  // Create a conversation between Maria and Associació Lliure about the website
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        connect: [{ id: maria.id }, { id: associacio.id }],
      },
    },
  });

  await prisma.connection.create({
    data: {
      postId: post_website.id,
      requesterId: maria.id,
      status: "ACCEPTED",
      conversationId: conversation.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "Hello! I saw you need help with a website. I'm not a developer, but my nephew is and I've watched him do it enough times to be dangerous. Want to chat?",
      conversationId: conversation.id,
      senderId: maria.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "We'll take any help we can get! Our current Facebook page has a cover photo from 2017 that nobody knows how to change.",
      conversationId: conversation.id,
      senderId: associacio.id,
    },
  });

  await prisma.message.create({
    data: {
      content: "Perfect. Let's schedule a call. I promise the website will at least look like it's from this decade.",
      conversationId: conversation.id,
      senderId: maria.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log("Demo accounts (all use password123):");
  console.log("  maria@example.com (Private)");
  console.log("  info@associaciolliure.org (Collective)");
  console.log("  pau@example.com (Private)");
  console.log("  laia@example.com (Private)");
  console.log("  hola@colectiuverd.cat (Collective)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
