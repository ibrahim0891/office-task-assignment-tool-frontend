// Static mock data for the Project Module UI
// All data is hardcoded — no API calls

export interface MockUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email: string;
}

export type ProjectStatus = "Active" | "AtRisk" | "OnTrack" | "Completed" | "Archived";
export type ProjectRole = "Manager" | "Leader" | "Member" | "Viewer";
export type TaskStatus = "PendingAcceptance" | "Backlog" | "InProgress" | "AtRisk" | "Blocked" | "InReview" | "ReworkRequired" | "Completed" | "Done";
export type RiskLevel = "OnTrack" | "ApproachingDeadline" | "AtRisk" | "Overdue" | "CriticalSLA";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type EffortMode = "Shared" | "Parallel";
export type DependencyType = "FinishToStart" | "StartToStart";
export type BlockerCategory = "TechnicalDependency" | "AwaitingReview" | "ScopeAmbiguity" | "ResourceBottleneck" | "ExternalBlocker";
export type DefectCategory = "UnmetDoD" | "Bug" | "RequirementChange";

export interface MockProjectMember {
  userId: string;
  user: MockUser;
  role: ProjectRole;
  isPrimaryLeader: boolean;
  dailyCapacity: number;
}

export interface MockSubtask {
  id: string;
  title: string;
  assignedToId: string;
  assignedTo: MockUser;
  startDate: string;
  dueDate: string;
  estimatedDays: number;
  actualDaysLogged: number;
  status: TaskStatus;
  reviewerId?: string;
}

export interface MockSuperTask {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  startDate: string;
  dueDate: string;
  estimatedDays: number;
  effortMode: EffortMode;
  status: TaskStatus;
  riskLevel: RiskLevel;
  blockerCategory?: BlockerCategory;
  blockerReason?: string;
  priority: Priority;
  reworkCount: number;
  reopenCount: number;
  reviewerId?: string;
  assignees: MockUser[];
  subtasks: MockSubtask[];
}

export interface MockTaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
}

export interface MockProjectColumn {
  id: string;
  name: string;
  order: number;
}

export interface MockIncident {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  assigneeName: string;
  daysLate: number;
  escalationLevel: "Level1" | "Level2";
  leaderInaction: boolean;
  resolvedAt?: string;
}

export interface MockReworkEntry {
  taskId: string;
  taskTitle: string;
  cycleNumber: number;
  defectCategory: DefectCategory;
  rejectedBy: string;
}

export interface MockProject {
  id: string;
  title: string;
  description: string;
  emoji: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  manager: MockUser;
  members: MockProjectMember[];
  columns: MockProjectColumn[];
  tasks: MockSuperTask[];
  dependencies: MockTaskDependency[];
}

// ─── Mock Users ───

export const mockUsers: MockUser[] = [
  { id: "u1", name: "Sarah Connor", email: "sarah@example.com" },
  { id: "u2", name: "Alex Mercer", email: "alex@example.com" },
  { id: "u3", name: "Jane Smith", email: "jane@example.com" },
  { id: "u4", name: "Bob Taylor", email: "bob@example.com" },
  { id: "u5", name: "Elena Vance", email: "elena@example.com" },
  { id: "u6", name: "David Miller", email: "david@example.com" },
  { id: "u7", name: "Carlos Ramos", email: "carlos@example.com" },
  { id: "u8", name: "Mark Cole", email: "mark@example.com" },
];

// ─── Shared Columns ───

const defaultColumns: MockProjectColumn[] = [
  { id: "col-backlog", name: "Backlog", order: 0 },
  { id: "col-progress", name: "In Progress", order: 1 },
  { id: "col-review", name: "In Review", order: 2 },
  { id: "col-done", name: "Completed", order: 3 },
];

// ─── Helper ───

const getUser = (id: string) => mockUsers.find((u) => u.id === id)!;

// ─── Mock Projects ───

export const mockProjects: MockProject[] = [
  {
    id: "proj-1",
    title: "Mobile App v2",
    description: "Complete redesign and feature expansion of the mobile application with new auth flow, offline support, and push notifications.",
    emoji: "📱",
    startDate: "2026-08-01",
    endDate: "2026-09-15",
    status: "OnTrack",
    progress: 72,
    manager: getUser("u1"),
    members: [
      { userId: "u1", user: getUser("u1"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u2", user: getUser("u2"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 1.0 },
      { userId: "u3", user: getUser("u3"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u4", user: getUser("u4"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u8", user: getUser("u8"), role: "Member", isPrimaryLeader: false, dailyCapacity: 0.5 },
    ],
    columns: defaultColumns,
    tasks: [
      {
        id: "t1", projectId: "proj-1", columnId: "col-done", title: "Database Schema Design", description: "Design and implement the Prisma schema for auth, profiles, and settings.",
        startDate: "2026-08-01", dueDate: "2026-08-05", estimatedDays: 4, effortMode: "Shared", status: "Done", riskLevel: "OnTrack",
        priority: "High", reworkCount: 0, reopenCount: 0, assignees: [getUser("u2"), getUser("u3")],
        subtasks: [
          { id: "st1a", title: "Auth tables migration", assignedToId: "u2", assignedTo: getUser("u2"), startDate: "2026-08-01", dueDate: "2026-08-03", estimatedDays: 2, actualDaysLogged: 2, status: "Done" },
          { id: "st1b", title: "Profile & settings schema", assignedToId: "u3", assignedTo: getUser("u3"), startDate: "2026-08-03", dueDate: "2026-08-05", estimatedDays: 2, actualDaysLogged: 2.5, status: "Done" },
        ],
      },
      {
        id: "t2", projectId: "proj-1", columnId: "col-progress", title: "Authentication Flow", description: "Implement OAuth2 PKCE, JWT refresh tokens, and session management.",
        startDate: "2026-08-06", dueDate: "2026-08-18", estimatedDays: 8, effortMode: "Shared", status: "InProgress", riskLevel: "OnTrack",
        priority: "Urgent", reworkCount: 0, reopenCount: 0, reviewerId: "u2", assignees: [getUser("u3"), getUser("u4")],
        subtasks: [
          { id: "st2a", title: "OAuth2 PKCE provider setup", assignedToId: "u3", assignedTo: getUser("u3"), startDate: "2026-08-06", dueDate: "2026-08-10", estimatedDays: 3, actualDaysLogged: 3, status: "Done" },
          { id: "st2b", title: "JWT refresh token rotation", assignedToId: "u3", assignedTo: getUser("u3"), startDate: "2026-08-11", dueDate: "2026-08-14", estimatedDays: 3, actualDaysLogged: 1.5, status: "InProgress" },
          { id: "st2c", title: "Mobile login UI integration", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-14", dueDate: "2026-08-18", estimatedDays: 3, actualDaysLogged: 0, status: "Backlog" },
        ],
      },
      {
        id: "t3", projectId: "proj-1", columnId: "col-progress", title: "Push Notification Service", description: "FCM/APNs integration with token management and delivery tracking.",
        startDate: "2026-08-10", dueDate: "2026-08-22", estimatedDays: 6, effortMode: "Parallel", status: "AtRisk", riskLevel: "AtRisk",
        blockerCategory: "ResourceBottleneck", blockerReason: "Firebase project access pending from DevOps team.",
        priority: "High", reworkCount: 0, reopenCount: 0, assignees: [getUser("u4")],
        subtasks: [
          { id: "st3a", title: "FCM token registration", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-10", dueDate: "2026-08-14", estimatedDays: 3, actualDaysLogged: 1, status: "AtRisk" },
          { id: "st3b", title: "Notification delivery pipeline", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-15", dueDate: "2026-08-22", estimatedDays: 4, actualDaysLogged: 0, status: "Backlog" },
        ],
      },
      {
        id: "t4", projectId: "proj-1", columnId: "col-review", title: "Offline Data Sync", description: "IndexedDB caching layer with background sync for intermittent connectivity.",
        startDate: "2026-08-08", dueDate: "2026-08-19", estimatedDays: 7, effortMode: "Shared", status: "InReview", riskLevel: "OnTrack",
        priority: "Medium", reworkCount: 1, reopenCount: 0, reviewerId: "u2", assignees: [getUser("u2"), getUser("u8")],
        subtasks: [
          { id: "st4a", title: "IndexedDB abstraction layer", assignedToId: "u2", assignedTo: getUser("u2"), startDate: "2026-08-08", dueDate: "2026-08-12", estimatedDays: 3, actualDaysLogged: 3, status: "Done" },
          { id: "st4b", title: "Background sync queue", assignedToId: "u8", assignedTo: getUser("u8"), startDate: "2026-08-12", dueDate: "2026-08-17", estimatedDays: 3, actualDaysLogged: 3, status: "InReview" },
          { id: "st4c", title: "Conflict resolution strategy", assignedToId: "u2", assignedTo: getUser("u2"), startDate: "2026-08-17", dueDate: "2026-08-19", estimatedDays: 2, actualDaysLogged: 2, status: "Done" },
        ],
      },
      {
        id: "t5", projectId: "proj-1", columnId: "col-backlog", title: "E2E Test Suite", description: "Comprehensive end-to-end test coverage using Playwright.",
        startDate: "2026-08-25", dueDate: "2026-09-05", estimatedDays: 6, effortMode: "Shared", status: "PendingAcceptance", riskLevel: "OnTrack",
        priority: "Medium", reworkCount: 0, reopenCount: 0, assignees: [getUser("u8")],
        subtasks: [
          { id: "st5a", title: "Auth flow E2E tests", assignedToId: "u8", assignedTo: getUser("u8"), startDate: "2026-08-25", dueDate: "2026-08-29", estimatedDays: 3, actualDaysLogged: 0, status: "PendingAcceptance" },
          { id: "st5b", title: "Sync & offline E2E tests", assignedToId: "u8", assignedTo: getUser("u8"), startDate: "2026-09-01", dueDate: "2026-09-05", estimatedDays: 3, actualDaysLogged: 0, status: "PendingAcceptance" },
        ],
      },
    ],
    dependencies: [
      { id: "dep-1", predecessorTaskId: "t1", successorTaskId: "t2", dependencyType: "FinishToStart" },
      { id: "dep-2", predecessorTaskId: "t2", successorTaskId: "t5", dependencyType: "FinishToStart" },
      { id: "dep-3", predecessorTaskId: "t4", successorTaskId: "t5", dependencyType: "FinishToStart" },
    ],
  },
  {
    id: "proj-2",
    title: "Billing Revamp",
    description: "Overhaul billing engine with Stripe integration, subscription tiers, usage metering, and invoice generation.",
    emoji: "💳",
    startDate: "2026-08-15",
    endDate: "2026-10-01",
    status: "AtRisk",
    progress: 35,
    manager: getUser("u6"),
    members: [
      { userId: "u6", user: getUser("u6"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u5", user: getUser("u5"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 1.0 },
      { userId: "u7", user: getUser("u7"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u3", user: getUser("u3"), role: "Member", isPrimaryLeader: false, dailyCapacity: 0.5 },
    ],
    columns: defaultColumns,
    tasks: [
      {
        id: "t6", projectId: "proj-2", columnId: "col-done", title: "Stripe SDK Integration", description: "Initialize Stripe client, configure webhooks, and set up test environment.",
        startDate: "2026-08-15", dueDate: "2026-08-20", estimatedDays: 4, effortMode: "Shared", status: "Done", riskLevel: "OnTrack",
        priority: "High", reworkCount: 0, reopenCount: 0, assignees: [getUser("u5")],
        subtasks: [
          { id: "st6a", title: "Stripe client setup", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-08-15", dueDate: "2026-08-17", estimatedDays: 2, actualDaysLogged: 2, status: "Done" },
          { id: "st6b", title: "Webhook endpoint config", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-08-18", dueDate: "2026-08-20", estimatedDays: 2, actualDaysLogged: 2, status: "Done" },
        ],
      },
      {
        id: "t7", projectId: "proj-2", columnId: "col-progress", title: "Subscription Tier Engine", description: "Implement plan creation, upgrade/downgrade logic, and proration calculations.",
        startDate: "2026-08-18", dueDate: "2026-08-30", estimatedDays: 8, effortMode: "Shared", status: "Blocked", riskLevel: "Overdue",
        blockerCategory: "ScopeAmbiguity", blockerReason: "Proration rules for mid-cycle plan changes not yet finalized by product team.",
        priority: "Urgent", reworkCount: 0, reopenCount: 0, assignees: [getUser("u7"), getUser("u3")],
        subtasks: [
          { id: "st7a", title: "Plan CRUD operations", assignedToId: "u7", assignedTo: getUser("u7"), startDate: "2026-08-18", dueDate: "2026-08-22", estimatedDays: 3, actualDaysLogged: 3, status: "Done" },
          { id: "st7b", title: "Upgrade/downgrade flow", assignedToId: "u7", assignedTo: getUser("u7"), startDate: "2026-08-22", dueDate: "2026-08-26", estimatedDays: 3, actualDaysLogged: 1, status: "Blocked" },
          { id: "st7c", title: "Proration calculation engine", assignedToId: "u3", assignedTo: getUser("u3"), startDate: "2026-08-26", dueDate: "2026-08-30", estimatedDays: 3, actualDaysLogged: 0, status: "Backlog" },
        ],
      },
      {
        id: "t8", projectId: "proj-2", columnId: "col-backlog", title: "Invoice Generation & PDF Export", description: "Auto-generate monthly invoices with PDF rendering and email delivery.",
        startDate: "2026-09-01", dueDate: "2026-09-15", estimatedDays: 10, effortMode: "Shared", status: "Backlog", riskLevel: "OnTrack",
        priority: "Medium", reworkCount: 0, reopenCount: 0, assignees: [getUser("u7"), getUser("u5")],
        subtasks: [
          { id: "st8a", title: "Invoice data model", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-09-01", dueDate: "2026-09-05", estimatedDays: 3, actualDaysLogged: 0, status: "Backlog" },
          { id: "st8b", title: "PDF template & rendering", assignedToId: "u7", assignedTo: getUser("u7"), startDate: "2026-09-05", dueDate: "2026-09-10", estimatedDays: 4, actualDaysLogged: 0, status: "Backlog" },
          { id: "st8c", title: "Email delivery integration", assignedToId: "u7", assignedTo: getUser("u7"), startDate: "2026-09-10", dueDate: "2026-09-15", estimatedDays: 3, actualDaysLogged: 0, status: "Backlog" },
        ],
      },
    ],
    dependencies: [
      { id: "dep-4", predecessorTaskId: "t6", successorTaskId: "t7", dependencyType: "FinishToStart" },
      { id: "dep-5", predecessorTaskId: "t7", successorTaskId: "t8", dependencyType: "FinishToStart" },
    ],
  },
  {
    id: "proj-3",
    title: "AI Search Engine",
    description: "Semantic search with vector embeddings, RAG pipeline, and relevance ranking for the knowledge base.",
    emoji: "🔍",
    startDate: "2026-07-10",
    endDate: "2026-08-30",
    status: "OnTrack",
    progress: 92,
    manager: getUser("u5"),
    members: [
      { userId: "u5", user: getUser("u5"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u1", user: getUser("u1"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 0.5 },
      { userId: "u7", user: getUser("u7"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
    ],
    columns: defaultColumns,
    tasks: [
      {
        id: "t9", projectId: "proj-3", columnId: "col-done", title: "Vector Embedding Pipeline", description: "OpenAI embedding API integration with pgvector storage.",
        startDate: "2026-07-10", dueDate: "2026-07-25", estimatedDays: 10, effortMode: "Shared", status: "Done", riskLevel: "OnTrack",
        priority: "High", reworkCount: 0, reopenCount: 0, assignees: [getUser("u5"), getUser("u7")],
        subtasks: [
          { id: "st9a", title: "Embedding API connector", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-07-10", dueDate: "2026-07-18", estimatedDays: 5, actualDaysLogged: 5, status: "Done" },
          { id: "st9b", title: "pgvector schema & indexing", assignedToId: "u7", assignedTo: getUser("u7"), startDate: "2026-07-18", dueDate: "2026-07-25", estimatedDays: 5, actualDaysLogged: 5, status: "Done" },
        ],
      },
      {
        id: "t10", projectId: "proj-3", columnId: "col-review", title: "RAG Query Pipeline", description: "Retrieval-augmented generation with context windowing and relevance scoring.",
        startDate: "2026-07-28", dueDate: "2026-08-15", estimatedDays: 12, effortMode: "Shared", status: "InReview", riskLevel: "OnTrack",
        priority: "High", reworkCount: 0, reopenCount: 0, reviewerId: "u1", assignees: [getUser("u5")],
        subtasks: [
          { id: "st10a", title: "Query decomposition logic", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-07-28", dueDate: "2026-08-05", estimatedDays: 6, actualDaysLogged: 6, status: "Done" },
          { id: "st10b", title: "Context window assembly", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-08-05", dueDate: "2026-08-12", estimatedDays: 5, actualDaysLogged: 5, status: "InReview" },
        ],
      },
    ],
    dependencies: [
      { id: "dep-6", predecessorTaskId: "t9", successorTaskId: "t10", dependencyType: "FinishToStart" },
    ],
  },
  {
    id: "proj-4",
    title: "Design System 2.0",
    description: "Component library refresh with accessibility audit, dark mode tokens, and Storybook documentation.",
    emoji: "🎨",
    startDate: "2026-08-10",
    endDate: "2026-09-20",
    status: "OnTrack",
    progress: 48,
    manager: getUser("u2"),
    members: [
      { userId: "u2", user: getUser("u2"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 0.5 },
      { userId: "u4", user: getUser("u4"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 1.0 },
      { userId: "u8", user: getUser("u8"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
    ],
    columns: defaultColumns,
    tasks: [
      {
        id: "t11", projectId: "proj-4", columnId: "col-done", title: "Accessibility Audit", description: "WCAG 2.1 AA compliance audit across all core components.",
        startDate: "2026-08-10", dueDate: "2026-08-18", estimatedDays: 5, effortMode: "Shared", status: "Done", riskLevel: "OnTrack",
        priority: "High", reworkCount: 0, reopenCount: 0, assignees: [getUser("u4")],
        subtasks: [
          { id: "st11a", title: "Keyboard navigation audit", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-10", dueDate: "2026-08-14", estimatedDays: 3, actualDaysLogged: 3, status: "Done" },
          { id: "st11b", title: "Screen reader compatibility", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-14", dueDate: "2026-08-18", estimatedDays: 2, actualDaysLogged: 2, status: "Done" },
        ],
      },
      {
        id: "t12", projectId: "proj-4", columnId: "col-progress", title: "Dark Mode Token System", description: "Extract and formalize CSS custom property system for multi-theme support.",
        startDate: "2026-08-19", dueDate: "2026-08-29", estimatedDays: 7, effortMode: "Shared", status: "InProgress", riskLevel: "OnTrack",
        priority: "Medium", reworkCount: 0, reopenCount: 0, assignees: [getUser("u4"), getUser("u8")],
        subtasks: [
          { id: "st12a", title: "Token extraction & documentation", assignedToId: "u4", assignedTo: getUser("u4"), startDate: "2026-08-19", dueDate: "2026-08-23", estimatedDays: 3, actualDaysLogged: 2, status: "InProgress" },
          { id: "st12b", title: "Component token migration", assignedToId: "u8", assignedTo: getUser("u8"), startDate: "2026-08-23", dueDate: "2026-08-29", estimatedDays: 4, actualDaysLogged: 0, status: "Backlog" },
        ],
      },
    ],
    dependencies: [
      { id: "dep-7", predecessorTaskId: "t11", successorTaskId: "t12", dependencyType: "FinishToStart" },
    ],
  },
  {
    id: "proj-5",
    title: "Internal Tooling Portal",
    description: "Admin dashboard for user management, feature flags, and system configuration.",
    emoji: "⚙️",
    startDate: "2026-09-01",
    endDate: "2026-10-15",
    status: "Active",
    progress: 0,
    manager: getUser("u1"),
    members: [
      { userId: "u1", user: getUser("u1"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 0.5 },
      { userId: "u6", user: getUser("u6"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 1.0 },
      { userId: "u3", user: getUser("u3"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
    ],
    columns: defaultColumns,
    tasks: [],
    dependencies: [],
  },
  {
    id: "proj-6",
    title: "Q3 Security Hardening",
    description: "Penetration testing, dependency audit, CSP headers, and secrets rotation across all services.",
    emoji: "🔒",
    startDate: "2026-07-01",
    endDate: "2026-08-15",
    status: "Completed",
    progress: 100,
    manager: getUser("u2"),
    members: [
      { userId: "u2", user: getUser("u2"), role: "Manager", isPrimaryLeader: false, dailyCapacity: 1.0 },
      { userId: "u1", user: getUser("u1"), role: "Leader", isPrimaryLeader: true, dailyCapacity: 0.5 },
      { userId: "u5", user: getUser("u5"), role: "Member", isPrimaryLeader: false, dailyCapacity: 1.0 },
    ],
    columns: defaultColumns,
    tasks: [
      {
        id: "t13", projectId: "proj-6", columnId: "col-done", title: "Penetration Test Execution", description: "Full external and internal pen test with OWASP Top 10 coverage.",
        startDate: "2026-07-01", dueDate: "2026-07-20", estimatedDays: 14, effortMode: "Shared", status: "Done", riskLevel: "OnTrack",
        priority: "Urgent", reworkCount: 0, reopenCount: 0, assignees: [getUser("u5")],
        subtasks: [
          { id: "st13a", title: "External pen test", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-07-01", dueDate: "2026-07-10", estimatedDays: 7, actualDaysLogged: 7, status: "Done" },
          { id: "st13b", title: "Internal pen test", assignedToId: "u5", assignedTo: getUser("u5"), startDate: "2026-07-10", dueDate: "2026-07-20", estimatedDays: 7, actualDaysLogged: 7, status: "Done" },
        ],
      },
    ],
    dependencies: [],
  },
];

// ─── Aggregated Metrics ───

export const portfolioStats = {
  activeProjects: mockProjects.filter((p) => p.status !== "Completed" && p.status !== "Archived").length,
  onTimeRate: 89,
  criticalSLABreaches: 2,
  overbookedMembers: 3,
};

// ─── Incident Log (for Analytics Tab) ───

export const mockIncidents: MockIncident[] = [
  {
    id: "inc-1",
    taskId: "t7",
    taskTitle: "Subscription Tier Engine",
    projectName: "Billing Revamp",
    assigneeName: "Carlos Ramos",
    daysLate: 3,
    escalationLevel: "Level1",
    leaderInaction: false,
  },
  {
    id: "inc-2",
    taskId: "t3",
    taskTitle: "Push Notification Service",
    projectName: "Mobile App v2",
    assigneeName: "Bob Taylor",
    daysLate: 2,
    escalationLevel: "Level1",
    leaderInaction: true,
  },
];

// ─── Rework Log (for Analytics Tab) ───

export const mockReworkEntries: MockReworkEntry[] = [
  { taskId: "t4", taskTitle: "Offline Data Sync", cycleNumber: 1, defectCategory: "Bug", rejectedBy: "Alex Mercer" },
];

// ─── Capacity Heatmap Data (for Analytics Tab) ───

export interface CapacityDay {
  date: string;
  dayLabel: string;
  utilization: number;
}

export interface MemberCapacity {
  user: MockUser;
  role: ProjectRole;
  activeTasks: number;
  days: CapacityDay[];
}

export const mockCapacityData: MemberCapacity[] = [
  {
    user: getUser("u3"), role: "Member", activeTasks: 3,
    days: [
      { date: "2026-08-21", dayLabel: "Thu", utilization: 1.4 },
      { date: "2026-08-22", dayLabel: "Fri", utilization: 1.4 },
      { date: "2026-08-25", dayLabel: "Mon", utilization: 0.9 },
      { date: "2026-08-26", dayLabel: "Tue", utilization: 0.5 },
      { date: "2026-08-27", dayLabel: "Wed", utilization: 0.5 },
      { date: "2026-08-28", dayLabel: "Thu", utilization: 0.0 },
      { date: "2026-08-29", dayLabel: "Fri", utilization: 0.0 },
    ],
  },
  {
    user: getUser("u4"), role: "Member", activeTasks: 2,
    days: [
      { date: "2026-08-21", dayLabel: "Thu", utilization: 0.8 },
      { date: "2026-08-22", dayLabel: "Fri", utilization: 0.8 },
      { date: "2026-08-25", dayLabel: "Mon", utilization: 1.1 },
      { date: "2026-08-26", dayLabel: "Tue", utilization: 1.1 },
      { date: "2026-08-27", dayLabel: "Wed", utilization: 0.6 },
      { date: "2026-08-28", dayLabel: "Thu", utilization: 0.6 },
      { date: "2026-08-29", dayLabel: "Fri", utilization: 0.6 },
    ],
  },
  {
    user: getUser("u2"), role: "Leader", activeTasks: 1,
    days: [
      { date: "2026-08-21", dayLabel: "Thu", utilization: 0.5 },
      { date: "2026-08-22", dayLabel: "Fri", utilization: 0.5 },
      { date: "2026-08-25", dayLabel: "Mon", utilization: 0.5 },
      { date: "2026-08-26", dayLabel: "Tue", utilization: 0.5 },
      { date: "2026-08-27", dayLabel: "Wed", utilization: 0.5 },
      { date: "2026-08-28", dayLabel: "Thu", utilization: 0.5 },
      { date: "2026-08-29", dayLabel: "Fri", utilization: 0.5 },
    ],
  },
  {
    user: getUser("u8"), role: "Member", activeTasks: 2,
    days: [
      { date: "2026-08-21", dayLabel: "Thu", utilization: 1.8 },
      { date: "2026-08-22", dayLabel: "Fri", utilization: 1.8 },
      { date: "2026-08-25", dayLabel: "Mon", utilization: 1.3 },
      { date: "2026-08-26", dayLabel: "Tue", utilization: 1.1 },
      { date: "2026-08-27", dayLabel: "Wed", utilization: 0.8 },
      { date: "2026-08-28", dayLabel: "Thu", utilization: 0.5 },
      { date: "2026-08-29", dayLabel: "Fri", utilization: 0.0 },
    ],
  },
];
