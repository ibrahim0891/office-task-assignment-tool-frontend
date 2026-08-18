"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportView from "../../components/ReportView";
import { useWorkspace } from "../../context/WorkspaceContext";
import { SkeletonList } from "../../components/ui/SkeletonLoader";

export default function ReportsPage() {
    const { currentTeam, userRole } = useWorkspace();
    const router = useRouter();

    useEffect(() => {
        if (currentTeam && userRole !== "LEADER") {
            router.replace("/");
        }
    }, [currentTeam, userRole, router]);

    if (!currentTeam) {
        return <SkeletonList />;
    }

    if (userRole !== "LEADER") {
        return <SkeletonList />;
    }

    return <ReportView currentTeam={currentTeam} />;
}
