import NextAuth from 'next-auth'
import { NextAuthConfig } from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

const authOptions: NextAuthConfig = {
  callbacks: {
    async signIn({ profile }) {
      return profile?.login === 'imrebartis'
    }
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? '',
      clientSecret: process.env.GITHUB_SECRET ?? '',
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    })
  ],
  basePath: '/api/auth',
  secret: process.env.NEXTAUTH_SECRET
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)
