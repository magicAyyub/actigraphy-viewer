import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
// import { redirect } from 'next/navigation' //Removed as per update 1

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>Actigraphy Viewer</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <header className="border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center">
                <MainNav />
              </div>
            </header>
            <main className="flex-1">
              <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
              {children}
              </div>         
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}