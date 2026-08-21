import confetti from "canvas-confetti";

interface ConfettiOptions {
    durationMs?: number;
    colors?: string[];
    intensity?: "subtle" | "medium" | "epic";
}

/**
 * Editorial & formal executive metallic palette (Champagne gold, charcoal, platinum & bronze)
 */
function getFormalEditorialPalette(): string[] {
    if (typeof document === "undefined") {
        return ["#1A1A1A", "#8C7355", "#B08800", "#4A5568", "#2D3748"];
    }

    const isDark = document.documentElement.getAttribute("data-theme")?.includes("dark");
    if (isDark) {
        // Luxury platinum, champagne, muted gold & frost slate
        return ["#ECEFF4", "#EBCB8B", "#D8DEE9", "#88C0D0", "#A3BE8C", "#C0A97A"];
    }
    // Formal editorial charcoal, champagne bronze, rich gold, muted slate
    return ["#1A1A1A", "#8C7355", "#B08800", "#4A5568", "#2E5A88", "#22863A"];
}

/**
 * Fires an executive, formal metallic micro-sparkle burst from both edges.
 * Restrained, elegant, and fast with zero carnival/casual vibe.
 */
export function triggerMicroCelebration(options?: ConfettiOptions) {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (localStorage.getItem("sys_enable_confetti") === "false") return;

    const colors = options?.colors || getFormalEditorialPalette();
    const isEpic = options?.intensity === "epic";
    const particleCount = isEpic ? 28 : 18;

    // Synchronized, crisp executive dual-edge burst
    confetti({
        particleCount,
        angle: 60,
        spread: 45,
        origin: { x: 0.05, y: 0.8 },
        colors,
        ticks: 200,
        gravity: 1.1,
        decay: 0.92,
        scalar: 0.75,
        shapes: ["square", "circle"],
        zIndex: 999999,
        disableForReducedMotion: true,
    });

    confetti({
        particleCount,
        angle: 120,
        spread: 45,
        origin: { x: 0.95, y: 0.8 },
        colors,
        ticks: 200,
        gravity: 1.1,
        decay: 0.92,
        scalar: 0.75,
        shapes: ["square", "circle"],
        zIndex: 999999,
        disableForReducedMotion: true,
    });

    // Secondary subtle micro-twinkle for epic completions
    if (isEpic) {
        setTimeout(() => {
            confetti({
                particleCount: 14,
                angle: 65,
                spread: 35,
                origin: { x: 0.1, y: 0.75 },
                colors,
                ticks: 180,
                gravity: 1.15,
                decay: 0.91,
                scalar: 0.65,
                shapes: ["circle"],
                zIndex: 999999,
                disableForReducedMotion: true,
            });

            confetti({
                particleCount: 14,
                angle: 115,
                spread: 35,
                origin: { x: 0.9, y: 0.75 },
                colors,
                ticks: 180,
                gravity: 1.15,
                decay: 0.91,
                scalar: 0.65,
                shapes: ["circle"],
                zIndex: 999999,
                disableForReducedMotion: true,
            });
        }, 120);
    }
}
