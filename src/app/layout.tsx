import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import WorkspaceShell from "../components/WorkspaceShell";
import { APP_CONFIG } from "../config/appConfig";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const instrumentSerif = Instrument_Serif({
    variable: "--font-instrument-serif",
    subsets: ["latin"],
    weight: "400",
    style: ["normal", "italic"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "SM Technology — Workspace Assignment Tool",
    description:
        "Role-based task assignment and daily workflow management for teams.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    if (typeof window !== "undefined") {
        console.log("Frontend Configuration Loaded: Max Task Title Length =", APP_CONFIG.MAX_TASK_TITLE_LENGTH);
    }
    return (
        <html
            lang="en"
            className={`${inter.variable} ${instrumentSerif.variable} h-full`}
        >
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Caveat:wght@400..700&family=Cinzel:wght@400..700&family=Cormorant+Garamond:ital,wght@0,400..700;1,400..700&family=Dancing+Script:wght@400..700&family=Fira+Code:wght@400..700&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300..800;1,300..800&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Outfit:wght@300;400;500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Space+Grotesk:wght@300..700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-full flex flex-col">
                <Toaster
                    position="bottom-right"
                    toastOptions={{ duration: 3000 }}
                />
                <WorkspaceProvider>
                    <WorkspaceShell>{children}</WorkspaceShell>
                </WorkspaceProvider>
            </body>
        </html>
    );
}
