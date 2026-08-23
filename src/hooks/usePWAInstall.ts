import { useState, useEffect } from "react";

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkStandalone = () => {
            const isStandaloneMatch = window.matchMedia("(display-mode: standalone)").matches;
            const isNavStandalone = (navigator as any).standalone === true;
            return isStandaloneMatch || isNavStandalone;
        };

        setIsStandalone(checkStandalone());

        const userAgent = window.navigator.userAgent.toLowerCase();
        const iosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(iosDevice);

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsStandalone(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const handleMediaChange = (e: MediaQueryListEvent) => {
            setIsStandalone(e.matches);
        };
        mediaQuery.addEventListener("change", handleMediaChange);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
            mediaQuery.removeEventListener("change", handleMediaChange);
        };
    }, []);

    const promptInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
            return outcome;
        }
        return null;
    };

    return {
        isStandalone,
        isInstallable,
        isIOS,
        promptInstall,
        hasDeferredPrompt: !!deferredPrompt,
    };
}
