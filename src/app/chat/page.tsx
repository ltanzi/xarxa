import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatList } from "@/components/chat/ChatList";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { id: session.user.id } },
    },
    include: {
      participants: { select: { id: true, name: true, profilePhoto: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-3xl font-light mb-12">Messages</h1>
      <ChatList conversations={JSON.parse(JSON.stringify(conversations))} />
    </div>
  );
}
