import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { APP_CONFIG } from "../config/appConfig";
import InitialLoadingOverlay from "../components/InitialLoadingOverlay";

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
    title: "OfficeTask — Task Assignment Board",
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
            suppressHydrationWarning
            className={`${inter.variable} ${instrumentSerif.variable} h-full`}
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    // Apply Theme
                                    var theme = localStorage.getItem('sys_theme');
                                    if (theme) {
                                        document.documentElement.setAttribute('data-theme', theme);
                                    }

                                    // Apply Accent Color
                                    var isDark = theme && theme !== 'light';
                                    var accent = isDark
                                        ? (localStorage.getItem('sys_accent_dark') || '#00D26A')
                                        : (localStorage.getItem('sys_accent_light') || '#1A1A1A');
                                    if (accent) {
                                        document.documentElement.style.setProperty('--color-accent', accent);
                                    }

                                    // Apply Fonts & Scale
                                    var primary = localStorage.getItem('sys_primary_font') || 'Outfit';
                                    var secondary = localStorage.getItem('sys_secondary_font') || 'Lora';
                                    var scale = localStorage.getItem('sys_font_scale') || '1.25';

                                    var fontMap = {
                                        Outfit: "'Outfit', sans-serif",
                                        Lora: "'Lora', serif",
                                        Lexend: "'Lexend', sans-serif",
                                        "Instrument Serif": "'Instrument Serif', serif",
                                        "Caveat (Handwriting)": "'Caveat', cursive",
                                        "Dancing Script (Handwriting)": "'Dancing Script', cursive",
                                        "Pacifico (Handwriting)": "'Pacifico', cursive",
                                        "Darius (Bodoni)": "'Bodoni Moda', serif",
                                        "Cormorant Garamond": "'Cormorant Garamond', serif",
                                        "Playfair Display": "'Playfair Display', serif",
                                        Newsreader: "'Newsreader', serif",
                                        Cinzel: "'Cinzel', serif",
                                        Inter: "'Inter', sans-serif",
                                        Montserrat: "'Montserrat', sans-serif",
                                        "Space Grotesk": "'Space Grotesk', sans-serif",
                                        "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
                                        Roboto: "'Roboto', sans-serif",
                                        "Fira Code (Monospace)": "'Fira Code', monospace",
                                        Orbitron: "'Orbitron', sans-serif",
                                        VT323: "'VT323', monospace",
                                        "Google Sans Flex": "'Google Sans Flex Variable', 'Google Sans Flex', 'Google Sans', sans-serif",
                                        "System Default": "system-ui, -apple-system, sans-serif"
                                    };

                                    var root = document.documentElement;
                                    if (fontMap[primary]) {
                                        root.style.setProperty('--font-primary', fontMap[primary]);
                                        root.style.setProperty('--font-sans', fontMap[primary]);
                                        
                                        var styleEl = document.createElement('style');
                                        styleEl.innerHTML = 'body { font-family: ' + fontMap[primary] + ' !important; }';
                                        document.head.appendChild(styleEl);
                                    }
                                    if (fontMap[secondary]) {
                                        root.style.setProperty('--font-secondary', fontMap[secondary]);
                                        root.style.setProperty('--font-serif', fontMap[secondary]);
                                        root.style.setProperty('--font-instrument-serif', fontMap[secondary]);
                                    }
                                    if (scale) {
                                        root.style.setProperty('--font-scale', scale);
                                    }
                                } catch (e) {}
                            })();
                        `,
                    }}
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Caveat:wght@400..700&family=Cinzel:wght@400..700&family=Cormorant+Garamond:ital,wght@0,400..700;1,400..700&family=Dancing+Script:wght@400..700&family=Fira+Code:wght@400..700&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Montserrat:ital,wght@0,300..800;1,300..800&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Outfit:wght@300;400;500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Space+Grotesk:wght@300..700&family=Orbitron:wght@400..900&family=VT323&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/@fontsource-variable/google-sans-flex/index.css"
                />
            </head>
            <body className="min-h-full flex flex-col">
                <Toaster
                    position="bottom-right"
                    toastOptions={{ duration: 3000 }}
                />
                <WorkspaceProvider>
                    {children}
                    <InitialLoadingOverlay />
                </WorkspaceProvider>
            </body>
        </html>
    );
}
