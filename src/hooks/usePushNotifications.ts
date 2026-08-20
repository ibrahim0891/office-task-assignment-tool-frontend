import { useEffect } from "react";
import { api, User } from "../api";

const VAPID_PUBLIC_KEY = "BBRxqUMQFjy1V2-ZMrEpvbjkEbETuYQEfe6t02ZBgcBCLYGlyFE1SwkIrrkCej-dIMUyNKZhd7NKPQwbex0i81Y";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications(currentUser: User | null) {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            return;
        }

        if (!currentUser) return;

        const initializePush = async () => {
            try {
                // Register Service Worker
                const registration = await navigator.serviceWorker.register("/sw.js");
                console.log("[Service Worker] Registered successfully:", registration);

                // Setup listener for service worker messages
                const messageHandler = (event: MessageEvent) => {
                    if (event.data && event.data.type === "NAVIGATE_TO") {
                        window.location.href = event.data.url;
                    }
                };
                navigator.serviceWorker.addEventListener("message", messageHandler);

                // Check permission status
                let permission = Notification.permission;
                if (permission === "default") {
                    permission = await Notification.requestPermission();
                }

                if (permission !== "granted") {
                    console.warn("[Push Notification] Permission was not granted.");
                    return;
                }

                // Subscribe user to Push Manager
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedVapidKey,
                    });
                }

                // Send subscription to backend
                await api.savePushSubscription(subscription, currentUser.id);
                console.log("[Push Notification] Subscribed successfully.");
            } catch (err) {
                console.error("[Push Notification] Error initializing push notifications:", err);
            }
        };

        initializePush();
    }, [currentUser]);
}
