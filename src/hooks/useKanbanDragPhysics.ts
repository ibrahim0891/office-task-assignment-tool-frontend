import { useState, useRef, useEffect, useCallback } from "react";
import { playFeedback } from "../utils/feedback";

interface UseKanbanDragPhysicsOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    onDragStartNotify?: (draggableId: string) => void;
    onDragEndNotify?: () => void;
}

export function useKanbanDragPhysics({
    containerRef,
    onDragStartNotify,
    onDragEndNotify,
}: UseKanbanDragPhysicsOptions) {
    const [dragTilt, setDragTilt] = useState<{ rotateZ: number; rotateX: number }>({
        rotateZ: 0,
        rotateX: 0,
    });

    const dragInfoRef = useRef<{ isDragging: boolean; clientX: number }>({
        isDragging: false,
        clientX: 0,
    });

    const autoScrollTimerRef = useRef<number | null>(null);

    const velocityRef = useRef<{ lastX: number; lastY: number; lastTime: number }>({
        lastX: 0,
        lastY: 0,
        lastTime: 0,
    });

    const stopAutoScroll = useCallback(() => {
        if (autoScrollTimerRef.current) {
            cancelAnimationFrame(autoScrollTimerRef.current);
            autoScrollTimerRef.current = null;
        }
    }, []);

    const startAutoScroll = useCallback(() => {
        stopAutoScroll();

        const checkScroll = () => {
            if (!dragInfoRef.current.isDragging || !containerRef.current) return;

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const clientX = dragInfoRef.current.clientX;

            const threshold = 120; // Distance from edge to begin scrolling
            const maxSpeed = 75; // Maximum scroll speed

            const leftDist = clientX - rect.left;
            const rightDist = rect.right - clientX;

            if (rightDist < threshold && rightDist > -50) {
                const ratio = Math.max(0, 1 - rightDist / threshold);
                container.scrollLeft += ratio * maxSpeed;
            } else if (leftDist < threshold && leftDist > -50) {
                const ratio = Math.max(0, 1 - leftDist / threshold);
                container.scrollLeft -= ratio * maxSpeed;
            }

            autoScrollTimerRef.current = requestAnimationFrame(checkScroll);
        };

        autoScrollTimerRef.current = requestAnimationFrame(checkScroll);
    }, [containerRef, stopAutoScroll]);

    useEffect(() => {
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            if (!dragInfoRef.current.isDragging) return;
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
            dragInfoRef.current.clientX = clientX;

            const now = performance.now();
            const dt = Math.max(16, now - velocityRef.current.lastTime);

            if (velocityRef.current.lastTime > 0) {
                const vx = (clientX - velocityRef.current.lastX) / dt;
                const vy = (clientY - velocityRef.current.lastY) / dt;

                const targetRotateZ = Math.max(-6, Math.min(6, vx * 4.0));
                const targetRotateX = Math.max(-3.5, Math.min(3.5, -vy * 2.2));

                setDragTilt({ rotateZ: targetRotateZ, rotateX: targetRotateX });
            }

            velocityRef.current.lastX = clientX;
            velocityRef.current.lastY = clientY;
            velocityRef.current.lastTime = now;
        };

        window.addEventListener("mousemove", handlePointerMove, { passive: true });
        window.addEventListener("touchmove", handlePointerMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("touchmove", handlePointerMove);
            stopAutoScroll();
        };
    }, [stopAutoScroll]);

    const handleDragStart = useCallback(
        (start: any) => {
            dragInfoRef.current.isDragging = true;
            velocityRef.current = { lastX: 0, lastY: 0, lastTime: 0 };
            setDragTilt({ rotateZ: 0, rotateX: 0 });
            playFeedback("pickup");
            startAutoScroll();
            if (onDragStartNotify && start.draggableId) {
                onDragStartNotify(start.draggableId);
            }
        },
        [startAutoScroll, onDragStartNotify],
    );

    const handleDragEndCleanup = useCallback(() => {
        dragInfoRef.current.isDragging = false;
        setDragTilt({ rotateZ: 0, rotateX: 0 });
        playFeedback("drop");
        stopAutoScroll();
        if (onDragEndNotify) {
            onDragEndNotify();
        }
    }, [stopAutoScroll, onDragEndNotify]);

    return {
        dragTilt,
        handleDragStart,
        handleDragEndCleanup,
    };
}
