import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "");
        const password = String(credentials?.password || "");

        if (email === "demo@gestorcobros.local" && password === "demo1234") {
          return {
            id: "demo-user",
            name: "Jorge Demo",
            email: "demo@gestorcobros.local",
          };
        }

        return null;
      },
    }),
  ],
});
