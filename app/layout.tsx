import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Samlytics CV Optimizer - ATS-Optimized Resume Builder",
  description:
    "Get personalized CV sections optimized for 90-100% ATS compatibility. AI-powered professional summary, skills, and achievements tailored to your target job.",
  keywords: "CV optimizer, ATS resume, resume builder, job application, career tools, Samlytics",
  authors: [{ name: "Samlytics Data Services" }],
  creator: "Samlytics Data Services",
  publisher: "Samlytics Data Services",
  icons: {
    icon: "/samlytics-logo.png",
    shortcut: "/samlytics-logo.png",
    apple: "/samlytics-logo.png",
  },
  openGraph: {
    title: "Samlytics CV Optimizer",
    description: "AI-powered CV optimization for maximum ATS compatibility",
    url: "https://samlytics.co.uk",
    siteName: "Samlytics CV Optimizer",
    images: [
      {
        url: "/samlytics-logo.png",
        width: 1200,
        height: 630,
        alt: "Samlytics CV Optimizer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Samlytics CV Optimizer",
    description: "AI-powered CV optimization for maximum ATS compatibility",
    images: ["/samlytics-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/samlytics-logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/samlytics-logo.png" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
