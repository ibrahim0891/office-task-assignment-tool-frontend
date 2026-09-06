"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import ReportView from "@/components/ReportView";
import { useWorkspace } from "@/context/WorkspaceContext";
import { SkeletonReport } from "@/components/ui/SkeletonLoader";

export default function ReportsPage() {
    const { currentTeam, userRole } = useWorkspace();
    const router = useRouter();

    useEffect(() => {
        if (currentTeam && userRole !== "LEADER") {
            router.replace("/task-board");
        }
    }, [currentTeam, userRole, router]);

    if (!currentTeam) {
        return (
            <div className="p-3 sm:p-4">
                <SkeletonReport />
            </div>
        );
    }

    if (userRole !== "LEADER") {
        return (
            <div className="p-3 sm:p-4">
                <SkeletonReport />
            </div>
        );
    }

    return <ReportView currentTeam={currentTeam} />;
}
