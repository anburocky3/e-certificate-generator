import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    applicationName: "E-Certificate Platform",
    title: {
        default: "E-Certificate Platform",
        template: "%s | E-Certificate Platform",
    },
    description:
        "Secure certificate generation and download platform with PIN login, roll number search, and email lookup.",
    keywords: [
        "certificate download",
        "e-certificate",
        "student certificate portal",
        "roll number lookup",
        "certificate generator",
    ],
    authors: [{ name: "Anbuselvan Annamalai" }],
    creator: "Anbuselvan Annamalai",
    publisher: "Anbuselvan Annamalai",
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            noarchive: true,
        },
    },
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "E-Certificate Platform",
        description:
            "Secure certificate generation and download platform with PIN login, roll number search, and email lookup.",
        url: "/",
        siteName: "E-Certificate Platform",
        type: "website",
        locale: "en_IN",
    },
    twitter: {
        card: "summary",
        title: "E-Certificate Platform",
        description:
            "Secure certificate generation and download platform with PIN login, roll number search, and email lookup.",
    },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_60%)]" />


                <main className="relative flex-1 py-10 sm:py-14">
                    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
                </main>

                <footer
                    className="relative border-t border-slate-200/70 bg-white/70 py-6 text-sm text-slate-500 backdrop-blur-xl">
                    <div className=" flex items-center justify-center space-x-4">
                        Created with 💖:
                        <a href="https://anbuselvan-annamalai.com" target={'_blank'} className={'ml-2 hover:text-orange-600'}>
                        Anbuselvan Annamalai</a>
                        <span>|</span>
                        <a
                        href="https://github.com/anburocky3" target={'_blank'}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="currentColor"
                                  d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2" />
                        </svg>
                        </a>
                    </div>
                </footer>
            </div>
            </body>
        </html>
    );
}

