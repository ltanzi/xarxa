import { User, Post, Connection, Conversation, Message } from "@prisma/client";

export type { User, Post, Connection, Conversation, Message };

export type PostWithAuthor = Post & {
  author: Pick<User, "id" | "name" | "type" | "profilePhoto">;
};

export type ConnectionWithDetails = Connection & {
  post: Post;
  requester: Pick<User, "id" | "name" | "type" | "profilePhoto">;
};

export type ConversationWithDetails = Conversation & {
  participants: Pick<User, "id" | "name" | "profilePhoto">[];
  messages: Message[];
};

export type MessageWithSender = Message & {
  sender: Pick<User, "id" | "name" | "profilePhoto">;
};
