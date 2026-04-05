import { User, Post, Connection, Conversation, Message } from "@prisma/client";

export type { User, Post, Connection, Conversation, Message };

export type AuthorSummary = Pick<User, "id" | "name" | "surname" | "type" | "profilePhoto">;

export type ParticipantSummary = Pick<User, "id" | "name" | "profilePhoto">;

export type AuthorDetail = AuthorSummary & Pick<User, "location">;

export type PostWithAuthor = Post & {
  author: AuthorSummary;
};

export type PostWithAuthorDetail = Post & {
  author: AuthorDetail;
};

export type ConnectionWithDetails = Connection & {
  post: Post;
  requester: Pick<User, "id" | "name" | "type" | "profilePhoto">;
};

export type ConversationWithDetails = Conversation & {
  participants: ParticipantSummary[];
  messages: Message[];
};

export type MessageWithSender = Message & {
  sender: ParticipantSummary;
};
