/**
 * Smooth circular reveal theme transition using the View Transitions API.
 * The circular mask expands smoothly from the clicked button coordinates outward until it fills the entire screen.
 */
export function toggleThemeWithCircularReveal(
    event: React.MouseEvent | MouseEvent | undefined,
    applyTheme: () => void,
) {
    if (
        typeof document === "undefined" ||
        !("startViewTransition" in document) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
        applyTheme();
        return;
    }

    // Get click position (or center of viewport if event coordinates are unavailable)
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;

    // Calculate maximum radius to the furthest viewport corner
    const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
    );

    // Suppress child transitions during DOM snapshot capture to prevent layout/color stutters
    document.documentElement.classList.add("theme-transitioning");

    const transition = (document as any).startViewTransition(() => {
        applyTheme();
    });

    transition.ready.then(() => {
        const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        
        document.documentElement.animate(
            {
                clipPath: clipPath,
            },
            {
                duration: 1000,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                pseudoElement: "::view-transition-new(root)",
            },
        );
    });

    transition.finished.finally(() => {
        document.documentElement.classList.remove("theme-transitioning");
    });
}
