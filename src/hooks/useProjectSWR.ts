"use client";

import useSWR, { mutate as globalMutate, SWRConfiguration } from "swr";
import { api } from "../api";

export const PROJECT_KEYS = {
    projects: (teamId?: string, userId?: string) =>
        teamId ? (["projects", teamId, userId || "all"] as const) : null,
    portfolioSummary: (teamId?: string, userId?: string) =>
        teamId ? (["portfolio-summary", teamId, userId || "all"] as const) : null,
    projectDetail: (projectId?: string, teamId?: string) =>
        projectId ? (["project-detail", projectId, teamId || "default"] as const) : null,
    projectAnalytics: (projectId?: string, startDate?: string) =>
        projectId ? (["project-analytics", projectId, startDate || "all"] as const) : null,
    projectInvitations: (teamId?: string) =>
        teamId ? (["project-invitations", teamId] as const) : null,
    sentProjectInvitations: (teamId?: string) =>
        teamId ? (["sent-project-invitations", teamId] as const) : null,
    projectComments: (projectId?: string, taskId?: string, subtaskId?: string) =>
        projectId && taskId ? (["project-comments", projectId, taskId, subtaskId || "main"] as const) : null,
};

const DEFAULT_SWR_OPTIONS: SWRConfiguration = {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
};

/**
 * Hook to fetch and cache the list of projects for a team/user.
 */
export function useProjects(teamId?: string, userId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.projects(teamId, userId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any[]>(
        key,
        () => (teamId ? api.getProjects(teamId, userId) : Promise.resolve([])),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        projects: Array.isArray(data) ? data : [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache the portfolio summary metrics for a team/user.
 */
export function usePortfolioSummary(teamId?: string, userId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.portfolioSummary(teamId, userId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any>(
        key,
        () => (teamId ? api.getPortfolioSummary(teamId, userId) : Promise.resolve(null)),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        summary: data || {
            activeProjects: 0,
            onTimeRate: 100,
            criticalSLABreaches: 0,
            totalProjects: 0,
        },
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache a single project detail by ID.
 */
export function useProjectDetail(projectId?: string, teamId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.projectDetail(projectId, teamId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any>(
        key,
        () => (projectId ? api.getProjectDetail(projectId, teamId) : Promise.resolve(null)),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        project: data || null,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache project analytics data.
 */
export function useProjectAnalytics(projectId?: string, startDate?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.projectAnalytics(projectId, startDate);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any>(
        key,
        () => (projectId ? api.getProjectAnalytics(projectId, startDate) : Promise.resolve(null)),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        analytics: data || null,
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache received project invitations for a team.
 */
export function useProjectInvitations(teamId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.projectInvitations(teamId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any[]>(
        key,
        () => (teamId ? api.getReceivedProjectInvitations(teamId) : Promise.resolve([])),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        projectInvitations: Array.isArray(data) ? data : [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache sent project invitations for a team.
 */
export function useSentProjectInvitations(teamId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.sentProjectInvitations(teamId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any[]>(
        key,
        () => (teamId ? api.getSentProjectInvitations(teamId) : Promise.resolve([])),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        sentInvitations: Array.isArray(data) ? data : [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Hook to fetch and cache comments on a project task/subtask.
 */
export function useProjectComments(projectId?: string, taskId?: string, subtaskId?: string, config?: SWRConfiguration) {
    const key = PROJECT_KEYS.projectComments(projectId, taskId, subtaskId);
    const { data, error, isLoading, isValidating, mutate } = useSWR<any[]>(
        key,
        () => (projectId && taskId ? api.getProjectTaskComments(projectId, taskId, subtaskId) : Promise.resolve([])),
        { ...DEFAULT_SWR_OPTIONS, ...config }
    );

    return {
        comments: Array.isArray(data) ? data : [],
        isLoading,
        isValidating,
        error,
        mutate,
    };
}

/**
 * Invalidation and optimistic mutation helpers
 */
export const mutateProjectDetail = (projectId: string, teamId?: string, data?: any, shouldRevalidate = true) => {
    const key = PROJECT_KEYS.projectDetail(projectId, teamId);
    if (key) {
        if (data !== undefined) {
            return globalMutate(key, data, shouldRevalidate);
        }
        return globalMutate(key);
    }
};

export const mutateProjects = (teamId?: string, userId?: string) => {
    const key = PROJECT_KEYS.projects(teamId, userId);
    if (key) {
        return globalMutate(key);
    }
};

export const mutatePortfolioSummary = (teamId?: string, userId?: string) => {
    const key = PROJECT_KEYS.portfolioSummary(teamId, userId);
    if (key) {
        return globalMutate(key);
    }
};

export const mutateProjectInvitations = (teamId?: string) => {
    const key = PROJECT_KEYS.projectInvitations(teamId);
    if (key) {
        return globalMutate(key);
    }
};

export const revalidateAllProjects = () => {
    return globalMutate((key) => {
        if (Array.isArray(key)) {
            const first = key[0];
            return (
                first === "projects" ||
                first === "portfolio-summary" ||
                first === "project-detail" ||
                first === "project-analytics" ||
                first === "project-invitations" ||
                first === "sent-project-invitations"
            );
        }
        return false;
    });
};

export const revalidateProjectDetail = (projectId?: string) => {
    return globalMutate((key) => {
        if (Array.isArray(key)) {
            if (key[0] === "project-detail") {
                if (!projectId || key[1] === projectId) return true;
            }
            if (
                key[0] === "projects" ||
                key[0] === "portfolio-summary" ||
                key[0] === "project-analytics"
            ) {
                return true;
            }
        }
        return false;
    });
};
