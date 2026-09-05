import { APP_CONFIG } from './config/appConfig';
import { getLocalDateString } from './utils/date';

const API_BASE = APP_CONFIG.API_URL;

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers);
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("x-client-today", getLocalDateString());
  }
  const res = await window.fetch(input, {
    ...init,
    headers,
  });

  if (typeof window !== 'undefined') {
    const newToken = res.headers.get("x-refresh-token");
    if (newToken) {
      localStorage.setItem("sessionToken", newToken);
    }

    const urlStr = typeof input === 'string' ? input : ('url' in input ? input.url : input.toString());
    if (res.status === 401 && !urlStr.includes('/auth/login')) {
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionUser");
      localStorage.removeItem("task_user");
      localStorage.removeItem("selected_team_id");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }
  }

  return res;
};

const fetch = customFetch;

const inFlightGetRequests = new Map<string, Promise<any>>();

export function deduplicateGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlightGetRequests.get(key);
  if (existing) {
    return existing;
  }
  const promise = fetcher().finally(() => {
    inFlightGetRequests.delete(key);
  });
  inFlightGetRequests.set(key, promise);
  return promise;
}


export function getIframeProxyUrl(url: string) {
  return `${API_BASE}/iframe-proxy?url=${encodeURIComponent(url)}`;
}

export interface User {
  id: string;
  name?: string | null;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  secondaryEmail?: string | null;
  primaryPhone?: string | null;
  secondaryPhone?: string | null;
  emergencyContact?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  github?: string | null;
  bloodGroup?: string | null;
  designation?: string | null;
  bio?: string | null;
}

export interface Team {
  id: string;
  name: string;
  emoji?: string;
  createdById?: string;
  columns?: TaskColumn[];
  members?: { user: User; role: string }[];
}

export interface TaskColumn {
  id: string;
  teamId: string;
  name: string;
  order: number;
  wipLimit: number | null;
  isComplete: boolean;
  triggersCarryForward: boolean;
}



export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type?: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  actionType: string;
  details: string; // JSON string
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  columnId: string;
  priority: string;
  dueDate?: string;
  date: string;
  originalDate: string;
  carryCount: number;
  estimatedTime?: number;
  actualTime?: number;
  createdById: string;
  assignedToId: string;
  isRecurring: boolean;
  recurrence?: string;
  isSoftDeleted: boolean;
  isArchived: boolean;
  createdAt: string;
  
  column: TaskColumn;
  createdBy: User;
  assignedTo: User;
  checklist: ChecklistItem[];
  comments?: Comment[];
  attachments: Attachment[];
  _count?: {
    comments?: number;
    attachments?: number;
  };
  activities?: TaskActivity[];
}

export interface Notification {
  id: string;
  userId: string;
  content: string;
  isRead: boolean;
  isArchived?: boolean;
  archivedAt?: string;
  type: string;
  taskId?: string;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  teamId: string;
  title: string;
  content: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string; avatarUrl?: string | null };
}

export interface Bookmark {
  id: string;
  teamId: string;
  title: string;
  url: string;
  description?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; fullName: string; avatarUrl?: string | null };
}

export interface ReportTaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  columnId: string;
  isComplete: boolean;
  priority: string;
  carryCount: number;
  date: string;
  dueDate: string | null;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    designation?: string | null;
  };
  createdBy?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  checklist: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
  checklistStats: {
    total: number;
    completed: number;
  };
  latestComment?: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
    };
  } | null;
}

export interface MemberReportSummary {
  user: User;
  role: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  needsAttentionTasks: number;
  staleTasksCount: number;
  completionRate: number;
}

export interface DailyGroupReport {
  date: string;
  isToday: boolean;
  isYesterday: boolean;
  totalCount: number;
  completedCount: number;
  tasks: ReportTaskItem[];
}

export interface ReportData {
  startDate: string;
  endDate: string;
  todayDate: string;
  selectedMemberId: string;
  selectedMember: User | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  needsAttentionTasks: number;
  completionRate: number;
  columnsBreakdown: Record<string, number>;
  teamColumns?: Array<{ id: string; name: string; isComplete: boolean; order: number }>;
  staleTasksCount: number;
  memberBreakdown: MemberReportSummary[];
  dailyGroups: DailyGroupReport[];
  tasks: ReportTaskItem[];
}

// REST Client requests
export const api = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed.');
    }
    return res.json();
  },

  async register(
    fullName: string,
    email: string,
    password?: string
  ): Promise<{ user: User; token?: string; requiresVerification?: boolean }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: (fullName || '').trim(),
        email: (email || '').trim(),
        password: password || '',
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed.');
    }
    return res.json();
  },

  async getUsersExcludeTeam(teamId: string): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users/exclude-team/${teamId}`);
    return res.json();
  },

  async getUsers(search?: string): Promise<User[]> {
    const url = search ? `${API_BASE}/users?search=${encodeURIComponent(search)}` : `${API_BASE}/users`;
    return deduplicateGet(url, async () => {
      const res = await fetch(url);
      return res.json();
    });
  },

  async getUserProfile(userId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/users/profile/${userId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch user profile.');
    }
    return res.json();
  },

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/users/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user profile.');
    }
    return res.json();
  },

  async getTeams(userId?: string): Promise<Team[]> {
    const url = userId ? `${API_BASE}/teams?userId=${userId}` : `${API_BASE}/teams`;
    return deduplicateGet(url, async () => {
      const res = await fetch(url);
      return res.json();
    });
  },

  async createTeam(name: string, creatorId: string, emoji?: string): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, creatorId, emoji })
    });
    return res.json();
  },

  async updateTeam(teamId: string, name: string, actingUserId: string, emoji?: string): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update workspace');
    }
    return res.json();
  },

  async deleteTeam(teamId: string, password: string, confirmationText: string, actingUserId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify({ password, confirmationText })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete workspace');
    }
    return res.json();
  },

  async removeTeamMember(teamId: string, userId: string, actingUserId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members/remove`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async addTeamMember(teamId: string, userId: string, role: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    return res.json();
  },



  async inviteMemberByEmail(teamId: string, email: string, role: string, actingUserId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members/invite-by-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify({ email, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to invite member.');
    }
    return res.json();
  },

  async updateTeamMemberRole(teamId: string, userId: string, role: string, actingUserId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/members/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify({ userId, role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update member role.');
    }
    return res.json();
  },

  async getColumns(teamId: string): Promise<TaskColumn[]> {
    const url = `${API_BASE}/teams/${teamId}/columns`;
    return deduplicateGet(url, async () => {
      const res = await fetch(url);
      return res.json();
    });
  },

  async updateColumns(teamId: string, columns: any[]): Promise<TaskColumn[]> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns })
    });
    return res.json();
  },

  async deleteColumn(teamId: string, columnId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/teams/${teamId}/columns/${columnId}`, {
      method: 'DELETE'
    });
    return res.json();
  },



  async getTasks(params: {
    teamId: string;
    date?: string;
    userId?: string;
    search?: string;
    isSoftDeleted?: boolean;
    isArchived?: boolean;
    archivedOrDeleted?: boolean;
  }, actingUserId?: string): Promise<Task[]> {
    const query = new URLSearchParams();
    query.append('teamId', params.teamId);
    if (params.date) query.append('date', params.date);
    if (params.userId) query.append('userId', params.userId);
    if (params.search) query.append('search', params.search);
    if (params.isSoftDeleted) query.append('isSoftDeleted', 'true');
    if (params.isArchived) query.append('isArchived', 'true');
    if (params.archivedOrDeleted) query.append('archivedOrDeleted', 'true');

    const headers: any = {};
    if (actingUserId) {
      headers['x-user-id'] = actingUserId;
    }

    const res = await fetch(`${API_BASE}/tasks?${query.toString()}`, {
      headers
    });
    return res.json();
  },

  async getTask(taskId: string, teamId?: string): Promise<Task> {
    const headers: any = {};
    if (teamId) {
      headers['x-team-id'] = teamId;
    }
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers
    });
    return res.json();
  },

  async createTask(taskData: any): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    return res.json();
  },

  async updateTask(taskId: string, taskData: any, headers: { userId: string; teamId: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': headers.userId,
        'x-team-id': headers.teamId
      },
      body: JSON.stringify(taskData)
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update task.');
    }
    return res.json();
  },

  async deleteTask(taskId: string, userId: string): Promise<any> {
    const res = await customFetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete task.');
    }
    return res.json();
  },

  async restoreTask(taskId: string, userId: string): Promise<any> {
    const res = await customFetch(`${API_BASE}/tasks/${taskId}/restore`, {
      method: 'POST',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to restore task.');
    }
    return res.json();
  },

  async permanentlyDeleteTask(taskId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/permanent`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete task permanently.');
    }
    return res.json();
  },

  async addChecklistItem(taskId: string, title: string): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  async updateChecklistItem(taskId: string, itemId: string, isCompleted: boolean): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/checklist/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted })
    });
    return res.json();
  },

  async deleteChecklistItem(taskId: string, itemId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/checklist/${itemId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getTaskActivities(taskId: string, page = 1, limit = 15): Promise<{ activities: TaskActivity[]; totalCount: number; hasMore: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/activities?page=${page}&limit=${limit}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch task activities.");
    }
    return res.json();
  },

  async clearTaskActivities(taskId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/activities`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to clear activity logs.");
    }
    return res.json();
  },

  async getTaskComments(taskId: string, page = 1, limit = 15): Promise<{ comments: Comment[]; hasMore: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments?page=${page}&limit=${limit}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch task comments.');
    }
    return res.json();
  },

  async addComment(taskId: string, userId: string, content: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content })
    });
    return res.json();
  },

  async deleteComment(taskId: string, commentId: string, userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete comment.');
    }
    return res.json();
  },

  async resolveComment(taskId: string, commentId: string, userId: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}/resolve`, {
      method: 'PUT',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resolve comment.');
    }
    return res.json();
  },

  async reopenComment(taskId: string, commentId: string, userId: string): Promise<Comment> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/comments/${commentId}/reopen`, {
      method: 'PUT',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reopen comment.');
    }
    return res.json();
  },

  async addAttachment(taskId: string, attachmentData: { name: string; url: string; type?: string }, userId: string): Promise<Attachment> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(attachmentData)
    });
    return res.json();
  },

  async uploadTaskImage(taskId: string, imageBase64: string, filename: string, userId: string): Promise<Attachment> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ imageBase64, filename, userId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload image.');
    }
    return res.json();
  },

  async deleteAttachment(taskId: string, attachmentId: string, userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete attachment.');
    }
    return res.json();
  },

  async getReports(params: {
    teamId: string;
    daysFromToday?: number;
    startDate?: string;
    endDate?: string;
    memberId?: string;
  }): Promise<ReportData> {
    const query = new URLSearchParams();
    query.append('teamId', params.teamId);
    if (params.daysFromToday !== undefined) query.append('daysFromToday', String(params.daysFromToday));
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.memberId && params.memberId !== 'all') query.append('memberId', params.memberId);

    const res = await fetch(`${API_BASE}/reports?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch report data.');
    }
    return res.json();
  },

  async exportCsv(params: {
    teamId: string;
    daysFromToday?: number;
    startDate?: string;
    endDate?: string;
    memberId?: string;
  }): Promise<void> {
    const query = new URLSearchParams();
    query.append('teamId', params.teamId);
    if (params.daysFromToday !== undefined) query.append('daysFromToday', String(params.daysFromToday));
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.memberId && params.memberId !== 'all') query.append('memberId', params.memberId);

    const res = await fetch(`${API_BASE}/reports/export?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to export CSV');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${params.teamId}${params.memberId ? `-${params.memberId}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async getNotifications(userId: string, teamId: string, page?: number, limit?: number): Promise<Notification[]> {
    const url = new URL(`${API_BASE}/notifications`);
    url.searchParams.append('teamId', teamId);
    if (page) url.searchParams.append('page', page.toString());
    if (limit) url.searchParams.append('limit', limit.toString());
    const res = await fetch(url.toString(), {
      headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch notifications");
    }
    return res.json();
  },

  async markNotificationRead(id: string): Promise<Notification> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    });
    return res.json();
  },

  async clearAllNotifications(userId: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/clear-all`, {
      method: 'PUT',
      headers: { 'x-user-id': userId }
    });
  },

  async archiveNotification(id: string): Promise<Notification> {
    const res = await fetch(`${API_BASE}/notifications/${id}/archive`, {
      method: 'PUT'
    });
    return res.json();
  },

  async deleteArchivedNotifications(userId: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/archived`, {
      method: 'DELETE',
      headers: { 'x-user-id': userId }
    });
  },

  // Knowledge Base
  async getKnowledgeArticles(teamId: string): Promise<KnowledgeArticle[]> {
    const res = await fetch(`${API_BASE}/knowledge?teamId=${teamId}`);
    return res.json();
  },
  async createKnowledgeArticle(data: { teamId: string; title: string; content: string; createdById: string }): Promise<KnowledgeArticle> {
    const res = await fetch(`${API_BASE}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  },


  async updateKnowledgeArticle(id: string, data: { title: string; content: string }, actingUserId: string): Promise<KnowledgeArticle> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': actingUserId
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  },
  async deleteKnowledgeArticle(id: string, actingUserId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, { 
      method: 'DELETE',
      headers: {
        'x-user-id': actingUserId
      }
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
  },

  // Bookmarks
  async getBookmarks(teamId: string): Promise<Bookmark[]> {
    const res = await fetch(`${API_BASE}/bookmarks?teamId=${teamId}`);
    return res.json();
  },
  async createBookmark(data: { teamId: string; title: string; url: string; description?: string; createdById: string }): Promise<Bookmark> {
    const res = await fetch(`${API_BASE}/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  },
  async updateBookmark(id: string, data: { title: string; url: string; description?: string }): Promise<Bookmark> {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    return res.json();
  },
  async deleteBookmark(id: string): Promise<void> {
    await fetch(`${API_BASE}/bookmarks/${id}`, { method: 'DELETE' });
  },

  async verifyEmail(email: string, code: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Email verification failed.');
    }
    return res.json();
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to resend verification code.');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send password reset code.');
    }
    return res.json();
  },

  async resetPassword(email: string, code: string, newPasswordString: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword: newPasswordString })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password.');
    }
    return res.json();
  },

  async savePushSubscription(subscription: any, userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/push-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ subscription }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save push subscription.');
    }
  },

  async deletePushSubscription(endpoint: string): Promise<void> {
    const res = await fetch(`${API_BASE}/push-subscriptions/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete push subscription.');
    }
  },

  // ----------------------------------------------------
  // PROJECT MODULE API METHODS
  // ----------------------------------------------------
  async getProjects(teamId: string, userId?: string): Promise<any[]> {
    const headers: Record<string, string> = {
      'x-team-id': teamId,
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }
    const res = await fetch(`${API_BASE}/projects?teamId=${teamId}${userId ? `&userId=${userId}` : ''}`, {
      headers,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch projects.');
    }
    return res.json();
  },

  async getPortfolioSummary(teamId: string, userId?: string): Promise<any> {
    const headers: Record<string, string> = {
      'x-team-id': teamId,
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }
    const res = await fetch(`${API_BASE}/projects/summary?teamId=${teamId}${userId ? `&userId=${userId}` : ''}`, {
      headers,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch portfolio summary.');
    }
    return res.json();
  },

  async getProjectDetail(projectId: string, teamId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: teamId ? { 'x-team-id': teamId } : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch project details.');
    }
    return res.json();
  },

  async createProject(data: any, teamId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-team-id': teamId
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project.');
    }
    return res.json();
  },

  async updateProject(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update project.');
    }
    return res.json();
  },

  async deleteProject(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete project.');
    }
    return res.json();
  },

  async getProjectAnalytics(projectId: string, startDate?: string): Promise<any> {
    const url = startDate 
      ? `${API_BASE}/projects/${projectId}/analytics?startDate=${startDate}` 
      : `${API_BASE}/projects/${projectId}/analytics`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch project analytics.');
    }
    return res.json();
  },

  async addProjectMember(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add project member.');
    }
    return res.json();
  },

  async updateProjectMember(projectId: string, memberId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update project member.');
    }
    return res.json();
  },

  async removeProjectMember(projectId: string, memberId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove project member.');
    }
    return res.json();
  },

  async createProjectTask(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project task.');
    }
    return res.json();
  },

  async updateProjectTask(projectId: string, taskId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update project task.');
    }
    return res.json();
  },

  async deleteProjectTask(projectId: string, taskId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete project task.');
    }
    return res.json();
  },

  async createProjectColumn(projectId: string, name: string, type: string = "CUSTOM", isComplete: boolean = false): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, isComplete })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project column.');
    }
    return res.json();
  },

  async updateProjectColumn(projectId: string, columnId: string, data: { name?: string; type?: string; isComplete?: boolean }): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/columns/${columnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update project column.');
    }
    return res.json();
  },

  async deleteProjectColumn(projectId: string, columnId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/columns/${columnId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete project column.');
    }
    return res.json();
  },

  async reorderProjectColumns(projectId: string, columnOrders: { id: string; order: number }[]): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/columns/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnOrders })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reorder project columns.');
    }
    return res.json();
  },


  async reworkProjectTask(projectId: string, taskId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/rework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to rework project task.');
    }
    return res.json();
  },

  async createProjectSubtask(projectId: string, taskId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create subtask.');
    }
    return res.json();
  },

  async updateProjectSubtask(projectId: string, taskId: string, subtaskId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update subtask.');
    }
    return res.json();
  },

  async deleteProjectSubtask(projectId: string, taskId: string, subtaskId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete subtask.');
    }
    return res.json();
  },

  async createDependency(projectId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create dependency.');
    }
    return res.json();
  },

  async deleteDependency(projectId: string, dependencyId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/dependencies/${dependencyId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete dependency.');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // FOLDER API METHODS
  // ----------------------------------------------------
  async getFolders(teamId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/folders?teamId=${teamId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch folders.');
    }
    return res.json();
  },

  async createFolder(teamId: string, name: string, emoji?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-team-id': teamId
      },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create folder.');
    }
    return res.json();
  },

  async updateFolder(folderId: string, teamId: string, name?: string, emoji?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-team-id': teamId
      },
      body: JSON.stringify({ name, emoji })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update folder.');
    }
    return res.json();
  },

  async deleteFolder(folderId: string, teamId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/folders/${folderId}?teamId=${teamId}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete folder.');
    }
    return res.json();
  },

  // ----------------------------------------------------
  // PROJECT INVITATION API METHODS
  // ----------------------------------------------------
  async getReceivedProjectInvitations(teamId?: string): Promise<any[]> {
    const query = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`${API_BASE}/projects/invitations/received${query}`, {
      headers: teamId ? { 'x-team-id': teamId } : {}
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch received project invitations.');
    }
    return res.json();
  },

  async getSentProjectInvitations(teamId?: string): Promise<any[]> {
    const query = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`${API_BASE}/projects/invitations/sent${query}`, {
      headers: teamId ? { 'x-team-id': teamId } : {}
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch sent project invitations.');
    }
    return res.json();
  },

  async getPendingProjectInvitationsCount(teamId?: string): Promise<{ count: number }> {
    const query = teamId ? `?teamId=${teamId}` : '';
    const res = await fetch(`${API_BASE}/projects/invitations/count${query}`, {
      headers: teamId ? { 'x-team-id': teamId } : {}
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch invitations count.');
    }
    return res.json();
  },

  async sendProjectInvitation(projectId: string, data: { userId?: string; email?: string; role?: string; dailyCapacity?: number }, teamId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(teamId ? { 'x-team-id': teamId } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send project invitation.');
    }
    return res.json();
  },

  async acceptProjectInvitation(invitationId: string, teamId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(teamId ? { 'x-team-id': teamId } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept project invitation.');
    }
    return res.json();
  },

  async rejectProjectInvitation(invitationId: string, teamId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/invitations/${invitationId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(teamId ? { 'x-team-id': teamId } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to decline project invitation.');
    }
    return res.json();
  },

  async cancelProjectInvitation(invitationId: string, teamId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/invitations/${invitationId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(teamId ? { 'x-team-id': teamId } : {})
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel project invitation.');
    }
    return res.json();
  },
};
