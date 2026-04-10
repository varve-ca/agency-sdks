import { RootProvider } from "fumadocs-ui/provider"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import "./global.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: {
    template: "%s | @varve/agency-sdks",
    default: "@varve/agency-sdks — Government statistical API clients",
  },
  description:
    "Open source TypeScript clients for Statistics Canada and UK ONS APIs. Isomorphic, Zod-validated, works in Node.js, browsers, and Cloudflare Workers.",
}
