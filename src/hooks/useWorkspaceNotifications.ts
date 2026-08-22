"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { api, Notification, User, Team } from "../api";

export function useWorkspaceNotifications(
    currentUser: User | null,
    currentTeam: Team | null,
) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
    const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
    const [notificationsPage, setNotificationsPage] = useState(1);
    const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);

    const playNotificationChime = () => {
        try {
            // Disable app sound if the tab is not active/opened (hidden in background)
            if (typeof document !== "undefined" && document.hidden) {
                return;
            }

            const AudioContext =
                window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            // First chime note (D5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
            gain1.gain.setValueAtTime(0.15, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.15);

            // Second chime note (A5 - perfect fifth higher, slightly delayed)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
            gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.25);
        } catch (e) {
            console.error("Failed to play notification chime:", e);
        }
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const addNotificationToast = (notification: any) => {
        const id = Math.random().toString();
        setToasts((prev) => [...prev, { id, notification }]);
        playNotificationChime();
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const loadNotifications = async () => {
        if (!currentUser || !currentTeam) return;
        setIsNotificationsLoading(true);
        try {
            const data = await api.getNotifications(
                currentUser.id,
                currentTeam.id,
                1,
                10,
            );
            setNotifications(data);
            setNotificationsPage(1);
            setHasMoreNotifications(data.length === 10);
        } catch (err) {
            console.error("Error loading notifications:", err);
        } finally {
            setIsNotificationsLoading(false);
        }
    };

    const loadMoreNotifications = async () => {
        if (
            !currentUser ||
            !currentTeam ||
            isLoadingMoreNotifications ||
            !hasMoreNotifications
        )
            return;
        setIsLoadingMoreNotifications(true);
        try {
            const nextPage = notificationsPage + 1;
            const data = await api.getNotifications(
                currentUser.id,
                currentTeam.id,
                nextPage,
                10,
            );
            if (data.length > 0) {
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const newItems = data.filter((n) => !existingIds.has(n.id));
                    return [...prev, ...newItems];
                });
                setNotificationsPage(nextPage);
            }
            setHasMoreNotifications(data.length === 10);
        } catch (err) {
            console.error("Error loading more notifications:", err);
        } finally {
            setIsLoadingMoreNotifications(false);
        }
    };

    // Load initial notifications on user mount
    useEffect(() => {
        loadNotifications();
    }, [currentUser?.id]);

    const handleMarkNotificationRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleClearAllNotifications = async () => {
        if (!currentUser) return;
        try {
            await api.clearAllNotifications(currentUser.id);
            toast.success("All notifications moved to 30-day Archive.");
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleArchiveNotification = async (id: string) => {
        try {
            await api.archiveNotification(id);
            toast.success("Notification archived.");
            loadNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteArchivedNotifications = async () => {
        if (!currentUser) return;
        try {
            await api.deleteArchivedNotifications(currentUser.id);
            toast.success("Archived notifications permanently deleted.");
            loadNotifications();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete archived notifications.");
        }
    };

    return {
        notifications,
        setNotifications,
        isNotificationsLoading,
        hasMoreNotifications,
        isLoadingMoreNotifications,
        toasts,
        removeToast,
        addNotificationToast,
        loadNotifications,
        loadMoreNotifications,
        handleMarkNotificationRead,
        handleClearAllNotifications,
        handleArchiveNotification,
        handleDeleteArchivedNotifications,
    };
}
