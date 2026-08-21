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

export function applyAccentColor(theme: string, customLight?: string, customDark?: string) {
    if (typeof document === "undefined") return;
    const isDark = theme !== "light";
    const light = customLight || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_light") : null) || LIGHT_ACCENT_OPTIONS[0].value;
    const dark = customDark || (typeof window !== "undefined" ? localStorage.getItem("sys_accent_dark") : null) || DARK_ACCENT_OPTIONS[0].value;
    const activeAccent = isDark ? dark : light;
    document.documentElement.style.setProperty("--color-accent", activeAccent);
}
