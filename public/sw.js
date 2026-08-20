// Service Worker for Chrome/Browser Web Push Notifications

self.addEventListener("push", function (event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const title = data.title || "🔔 Workspace Update";
        const options = {
            body: data.body || "",
            icon: "/icon.png",
            badge: "/icon.png",
            vibrate: [100, 50, 100],
            data: {
                url: data.url || "/task-board",
            },
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error("Error parsing push notification data:", err);
    }
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "/task-board";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            // Check if there is already a tab open with a matching hostname
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Focus the tab if it's already on the app
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.postMessage({ type: "NAVIGATE_TO", url: targetUrl });
                    return client.focus();
                }
            }
            // If no tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
