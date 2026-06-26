import "next-auth";

// emailVerified is `string | null` in Session/JWT — NOT `Date | null`.
// The JWT round-trips through JSON, so we serialise Date → ISO string in
// the auth.ts jwt callback. Code that needs Date semantics should call
// `new Date(session.user.emailVerified)` at the use site.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      emailVerified: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    emailVerified?: string | null;
  }
}
