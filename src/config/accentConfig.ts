export interface AccentOption {
    name: string;
    value: string;
    description: string;
}

export const LIGHT_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Obsidian", value: "#1A1A1A", description: "Classic Ink Black (Default)" },
    { name: "Emerald", value: "#059669", description: "Forest Emerald" },
    { name: "Teal", value: "#0D9488", description: "Deep Teal" },
    { name: "Cyan Azure", value: "#0284C7", description: "Cyan Azure" },
    { name: "Royal Blue", value: "#2563EB", description: "Royal Blue" },
    { name: "Indigo Ink", value: "#4F46E5", description: "Deep Indigo Ink" },
    { name: "Royal Violet", value: "#7C3AED", description: "Royal Violet" },
    { name: "Purple Plum", value: "#9333EA", description: "Rich Purple Plum" },
    { name: "Crimson Rose", value: "#E11D48", description: "Crimson Rose" },
    { name: "Coral Flame", value: "#EA580C", description: "Vibrant Coral Flame" },
    { name: "Warm Amber", value: "#D97706", description: "Warm Amber Gold" },
    { name: "Olive Bronze", value: "#65A30D", description: "Olive Lime Bronze" },
    { name: "Steel Slate", value: "#475569", description: "Technical Slate Gray" },
    { name: "Espresso", value: "#78350F", description: "Warm Espresso Brown" },
    { name: "Ruby", value: "#BE123C", description: "Deep Ruby Red" },
];

export const DARK_ACCENT_OPTIONS: AccentOption[] = [
    { name: "LWS Emerald", value: "#00D26A", description: "LWS Signature Emerald (Default)" },
    { name: "Mint", value: "#10B981", description: "Vivid Mint Green" },
    { name: "Frost Cyan", value: "#88C0D0", description: "Nord Polar Frost" },
    { name: "Arctic Blue", value: "#38BDF8", description: "Vibrant Arctic Sky Blue" },
    { name: "Electric Blue", value: "#60A5FA", description: "Electric Cobalt Blue" },
    { name: "Neon Violet", value: "#A855F7", description: "Neon Purple Violet" },
    { name: "Lavender Mist", value: "#C084FC", description: "Soft Lavender Mist" },
    { name: "Cyber Magenta", value: "#E879F9", description: "Cyberpunk Magenta" },
    { name: "Coral Rose", value: "#FB7185", description: "Vibrant Coral Rose" },
    { name: "Sunset Orange", value: "#FB923C", description: "Vivid Sunset Orange" },
    { name: "Solar Gold", value: "#FBBF24", description: "Radiant Solar Gold" },
    { name: "Lime Glow", value: "#A3E635", description: "Electric Lime Glow" },
    { name: "Aurora Teal", value: "#2DD4BF", description: "Aurora Northern Teal" },
    { name: "Nord Purple", value: "#B48EAD", description: "Nord Pastel Purple" },
    { name: "Silver Mist", value: "#CBD5E1", description: "Luminescent Silver Slate" },
];

/** Accent options tuned for the Modern SaaS light palette */
export const MODERN_LIGHT_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Violet", value: "#8B5CF6", description: "Signature SaaS Violet (Default)" },
    { name: "Indigo", value: "#6366F1", description: "Deep Indigo" },
    { name: "Cobalt", value: "#3B82F6", description: "Clean Cobalt Blue" },
    { name: "Sky", value: "#0EA5E9", description: "Bright Sky Blue" },
    { name: "Ocean Teal", value: "#14B8A6", description: "Fresh Ocean Teal" },
    { name: "Emerald", value: "#10B981", description: "Vivid Emerald" },
    { name: "Leaf Green", value: "#22C55E", description: "Fresh Leaf Green" },
    { name: "Amber", value: "#F59E0B", description: "Warm Amber" },
    { name: "Tangerine", value: "#F97316", description: "Vivid Tangerine" },
    { name: "Rose", value: "#F43F5E", description: "Vibrant Rose" },
    { name: "Crimson", value: "#E11D48", description: "Deep Crimson" },
    { name: "Fuchsia", value: "#D946EF", description: "Electric Fuchsia" },
    { name: "Grape Purple", value: "#A855F7", description: "Grape Purple" },
    { name: "Midnight Navy", value: "#1E293B", description: "Clean Midnight Navy" },
    { name: "Slate Grey", value: "#64748B", description: "Minimalist Slate Grey" },
];

/** Accent options tuned for the Modern SaaS dark palette */
export const MODERN_DARK_ACCENT_OPTIONS: AccentOption[] = [
    { name: "Soft Violet", value: "#A78BFA", description: "Soft Violet (Default)" },
    { name: "Lavender", value: "#818CF8", description: "Soft Indigo Lavender" },
    { name: "Periwinkle", value: "#93C5FD", description: "Luminous Periwinkle" },
    { name: "Cyan", value: "#22D3EE", description: "Bright Electric Cyan" },
    { name: "Seafoam", value: "#5EEAD4", description: "Cool Seafoam Teal" },
    { name: "Mint", value: "#34D399", description: "Soft Mint Green" },
    { name: "Neon Emerald", value: "#4ADE80", description: "Glowing Neon Emerald" },
    { name: "Coral", value: "#FB7185", description: "Pastel Coral Rose" },
    { name: "Pink", value: "#F472B6", description: "Soft Pastel Pink" },
    { name: "Neon Magenta", value: "#F0ABFC", description: "Bright Neon Magenta" },
    { name: "Lilac", value: "#DDD6FE", description: "Delicate Lilac" },
    { name: "Gold", value: "#FCD34D", description: "Warm Sunlit Gold" },
    { name: "Peach Sunset", value: "#FDBA74", description: "Pastel Peach Sunset" },
    { name: "Ice Cyan", value: "#67E8F9", description: "Electric Ice Cyan" },
    { name: "Platinum", value: "#E2E8F0", description: "Cool Platinum Silver" },
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
