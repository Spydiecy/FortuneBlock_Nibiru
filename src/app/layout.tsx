'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
        <title>FortuneBlock - Decentralized Lottery Platform</title>
        <meta name="description" content="FortuneBlock is a decentralized lottery platform built on the Nibiru blockchain. Experience fair, transparent, and exciting lotteries powered by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="./favicon.ico" />
      </Head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="flex flex-col min-h-screen">
            <div className="flex-grow">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
