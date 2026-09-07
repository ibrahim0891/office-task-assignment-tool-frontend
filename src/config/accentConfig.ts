export interface AccentOption {
    name: string;
    value: string;
    description: string;
}

export const LIGHT_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Obsidian", value: "#1A1A1A", description: "Classic Ink Black" },
    { name: "Emerald", value: "#059669", description: "Forest Emerald" },
    { name: "Teal", value: "#0D9488", description: "Deep Teal" },
    { name: "Royal Blue", value: "#2563EB", description: "Royal Blue" },
    { name: "Violet", value: "#7C3AED", description: "Royal Violet" },
    { name: "Rose", value: "#E11D48", description: "Crimson Rose" },
    { name: "Amber", value: "#D97706", description: "Warm Amber" },
];

export const DARK_ACCENT_OPTIONS: AccentOption[] = [
    { name: "LWS Emerald", value: "#00D26A", description: "LWS Signature Emerald" },
    { name: "Mint", value: "#10B981", description: "Vivid Mint Green" },
    { name: "Frost Cyan", value: "#88C0D0", description: "Nord Polar Frost" },
    { name: "Sky Blue", value: "#38BDF8", description: "Vibrant Sky Blue" },
    { name: "Neon Violet", value: "#A855F7", description: "Neon Purple Violet" },
    { name: "Coral Rose", value: "#FB7185", description: "Vibrant Coral Rose" },
    { name: "Solar Gold", value: "#FBBF24", description: "Radiant Solar Gold" },
];

/** Accent options tuned for the Modern SaaS light palette */
export const MODERN_LIGHT_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Violet", value: "#8B5CF6", description: "Signature SaaS Violet (Default)" },
    { name: "Indigo", value: "#6366F1", description: "Deep Indigo" },
    { name: "Sky", value: "#0EA5E9", description: "Bright Sky Blue" },
    { name: "Emerald", value: "#10B981", description: "Vivid Emerald" },
    { name: "Rose", value: "#F43F5E", description: "Vibrant Rose" },
    { name: "Amber", value: "#F59E0B", description: "Warm Amber" },
    { name: "Fuchsia", value: "#D946EF", description: "Electric Fuchsia" },
];

/** Accent options tuned for the Modern SaaS dark palette */
export const MODERN_DARK_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Soft Violet", value: "#A78BFA", description: "Soft Violet (Default)" },
    { name: "Lavender", value: "#818CF8", description: "Soft Indigo Lavender" },
    { name: "Cyan", value: "#22D3EE", description: "Bright Cyan" },
    { name: "Mint", value: "#34D399", description: "Soft Mint Green" },
    { name: "Coral", value: "#FB7185", description: "Pastel Coral Rose" },
    { name: "Gold", value: "#FCD34D", description: "Warm Gold" },
    { name: "Pink", value: "#F472B6", description: "Soft Pink" },
];

export function applyAccentColor(theme: string, customLight?: string, customDark?: string) {
    if (typeof document === "undefined") return;
    const isModern = document.documentElement.getAttribute("data-ui") === "modern";
    const isDark = isModern
        ? document.documentElement.getAttribute("data-theme") === "modern-dark"
        : theme !== "light";

    let activeAccent: string;
    if (isModern) {
        // Modern mode: use its own accent keys with violet/soft-violet defaults
        const light = customLight
            || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_modern_light") : null)
            || MODERN_LIGHT_ACCENT_OPTIONS[0].value;
        const dark = customDark
            || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_modern_dark") : null)
            || MODERN_DARK_ACCENT_OPTIONS[0].value;
        activeAccent = isDark ? dark : light;
    } else {
        // Editorial mode: use editorial accent keys
        const light = customLight
            || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_light") : null)
            || LIGHT_ACCENT_OPTIONS[0].value;
        const dark = customDark
            || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_dark") : null)
            || DARK_ACCENT_OPTIONS[0].value;
        activeAccent = isDark ? dark : light;
    }

    document.documentElement.style.setProperty("--color-accent", activeAccent);
}
