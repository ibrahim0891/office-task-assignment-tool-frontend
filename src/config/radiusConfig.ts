export interface RadiusPreset {
    id: string;
    name: string;
    description: string;
    basePx: number;
    previewBorderRadius: string;
}

export const RADIUS_PRESETS: RadiusPreset[] = [
    {
        id: "sharp",
        name: "Sharp",
        description: "0px · Boxy & Technical",
        basePx: 0,
        previewBorderRadius: "0px",
    },
    {
        id: "crisp",
        name: "Crisp",
        description: "4px · Sleek SaaS (Default)",
        basePx: 4,
        previewBorderRadius: "4px",
    },
    {
        id: "rounded",
        name: "Rounded",
        description: "8px · Soft & Balanced",
        basePx: 8,
        previewBorderRadius: "8px",
    },
    {
        id: "curved",
        name: "Curved",
        description: "12px · Extra Smooth",
        basePx: 12,
        previewBorderRadius: "12px",
    },
];

export const DEFAULT_RADIUS_PX = 4;

/**
 * Calculates and dynamically sets CSS radius variables on documentElement:
 * --radius-xs, --radius-sm, --radius-md, --radius-lg, --radius-xl
 */
export function applyCornerRadius(basePx: number) {
    if (typeof document === "undefined") return;
    const clamped = Math.max(0, Math.min(16, isNaN(basePx) ? DEFAULT_RADIUS_PX : basePx));
    const cardPx = clamped === 0 ? 0 : Math.min(clamped, 8);
    const xs = clamped === 0 ? "0px" : `${Math.max(1, Math.min(cardPx, 3))}px`;
    const sm = `${clamped}px`;
    const md = clamped === 0 ? "0px" : `${Math.round(clamped * 1.35)}px`;
    const lg = clamped === 0 ? "0px" : `${Math.round(clamped * 1.6)}px`;
    const xl = clamped === 0 ? "0px" : `${Math.round(clamped * 1.8)}px`;
    const card = `${cardPx}px`;

    document.documentElement.style.setProperty("--radius-xs", xs);
    document.documentElement.style.setProperty("--radius-sm", sm);
    document.documentElement.style.setProperty("--radius-md", md);
    document.documentElement.style.setProperty("--radius-lg", lg);
    document.documentElement.style.setProperty("--radius-xl", xl);
    document.documentElement.style.setProperty("--radius-card", card);
}
