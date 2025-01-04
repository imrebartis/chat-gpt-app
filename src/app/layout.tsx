import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { signIn, auth } from '@/auth'
import { signOut } from 'next-auth/react'
import './globals.css'
import Link from 'next/link'
import UserButton from './components/UserButton'

const inter = Inter({
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app'
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  if (session?.user) {
    session.user = {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image
    }
  }
  return (
    <SessionProvider basePath='/api/auth' session={session}>
      <html lang='en'>
        <body className={`${inter.className} px-2 md:px-5`}>
          <header className='text-white font-bold bg-green-900 text-2xl p-2 mb-3 rounded-b-lg shadow-gray-700 shadow-lg flex'>
            <div className='flex flex-grow'>
              <Link href='/'>GPT Chat</Link>
              <Link href='/about' className='ml-5 font-light'>
                About
              </Link>
            </div>
            <div>
              <UserButton
                onSignIn={async () => {
                  'use server'
                  await signIn()
                }}
                onSignOut={signOut}
              />
            </div>
          </header>
          <div className='flex flex-col md:flex-row'>
            <div className='flex-grow'>{children}</div>
          </div>
        </body>
      </html>
    </SessionProvider>
  )
}
