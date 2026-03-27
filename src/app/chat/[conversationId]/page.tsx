import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";

interface ChatRoomPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { id: session.user.id } },
    },
    include: {
      participants: { select: { id: true, name: true, profilePhoto: true } },
    },
  });

  if (!conversation) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, profilePhoto: true } },
    },
  });

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  const otherParticipant = conversation.participants.find(
    (p) => p.id !== session.user.id
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="border-b p-4 flex items-center gap-3">
          <Link href="/chat" className="text-gray-400 hover:text-gray-600">
            &larr; Back
          </Link>
          {otherParticipant && (
            <Link href={`/profile/${otherParticipant.id}`} className="flex items-center gap-2 hover:opacity-80">
              <Avatar name={otherParticipant.name} src={otherParticipant.profilePhoto} size="sm" />
              <span className="font-medium text-sm">{otherParticipant.name}</span>
            </Link>
          )}
        </div>
        <ChatRoom
          conversationId={conversationId}
          initialMessages={JSON.parse(JSON.stringify(messages))}
        />
      </div>
    </div>
  );
}
