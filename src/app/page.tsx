"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import KanbanPage from "./kanban/page";

export default function WorkspaceHome() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/kanban");
    }, [router]);

    return <KanbanPage />;
}
