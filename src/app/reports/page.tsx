"use client";

import React from "react";
import ReportView from "../../components/ReportView";
import { useWorkspace } from "../../context/WorkspaceContext";
import { SkeletonList } from "../../components/ui/SkeletonLoader";

export default function ReportsPage() {
    const { currentTeam } = useWorkspace();

    if (!currentTeam) {
        return <SkeletonList />;
    }

    return <ReportView currentTeam={currentTeam} />;
}
