// src/api/admin.ts
import http from './http';
import { Song } from '../types';
import { ApiResponse } from '../types';

// ─── PageDto ────────────────────────────────────────────────────────────────

export interface PageDto<T> {
    items: T[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    isFirst: boolean;
    isLast: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface AdminUserDto {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export interface AdminUserDetails {
    id: number;
    email: string;
    name: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    totalSongs: number;
    totalEvents: number;
    lastEvents: AdminAnalyticsEvent[];
}

// ─── Song ────────────────────────────────────────────────────────────────────

export interface AdminSongDto {
    id: number;
    artist: string;
    title: string;
    ownerId: number;
    ownerEmail: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AdminAnalyticsEvent {
    id: number;
    userId?: number;
    userEmail?: string;
    eventType: string;
    label?: string;
    createdAt: string;
    ipAddress?: string;
    deviceType?: string;
    browser?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
    dau: number;
    wau: number;
    mau: number;
    eventsToday: number;
    eventsWeek: number;
    eventsMonth: number;
    totalUsers: number;
    totalSongs: number;
    totalEvents: number;
    topEventTypes: Array<{ type: string; count: number }>;
    topActiveUsers: Array<{ userId: number; email: string; count: number }>;
    deviceDistribution: Array<{ deviceType: string; count: number }>;
    browserDistribution: Array<{ browser: string; count: number }>;
    activityByHour: Array<{ hour: number; count: number }>;
    activityByDayOfWeek: Array<{ dayOfWeek: number; count: number }>;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const adminApi = {

    // Dashboard
    getDashboard: async (): Promise<DashboardStats> => {
        const res = await http.get<ApiResponse<DashboardStats>>('/admin/dashboard');
        return res.data.data;
    },

    // Users
    getUsers: async (page = 0, size = 20, sortBy = 'id', sortDir = 'desc'): Promise<PageDto<AdminUserDto>> => {
        const res = await http.get<ApiResponse<PageDto<AdminUserDto>>>('/admin/users', {
            params: { page, size, sortBy, sortDir },
        });
        return res.data.data;
    },

    getUserDetails: async (id: number): Promise<AdminUserDetails> => {
        const res = await http.get<ApiResponse<AdminUserDetails>>(`/admin/users/${id}`);
        return res.data.data;
    },

    getUserSongs: async (id: number, page = 0, size = 20): Promise<PageDto<AdminSongDto>> => {
        const res = await http.get<ApiResponse<PageDto<AdminSongDto>>>(`/admin/users/${id}/songs`, {
            params: { page, size },
        });
        return res.data.data;
    },

    getUserAnalytics: async (id: number, page = 0, size = 20): Promise<PageDto<AdminAnalyticsEvent>> => {
        const res = await http.get<ApiResponse<PageDto<AdminAnalyticsEvent>>>(`/admin/users/${id}/analytics`, {
            params: { page, size },
        });
        return res.data.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await http.delete(`/admin/users/${id}`);
    },

    // Songs
    getSongById: async (id: number): Promise<Song> => {
        const res = await http.get<ApiResponse<Song>>(`/admin/songs/${id}`);
        return res.data.data;
    },

    getAllSongs: async (page = 0, size = 20, sortBy = 'id', sortDir = 'desc'): Promise<PageDto<AdminSongDto>> => {
        const res = await http.get<ApiResponse<PageDto<AdminSongDto>>>('/admin/songs', {
            params: { page, size, sortBy, sortDir },
        });
        return res.data.data;
    },

    deleteSong: async (id: number): Promise<void> => {
        await http.delete(`/admin/songs/${id}`);
    },

    // Analytics
    getAnalytics: async (
        page = 0,
        size = 20,
        eventType?: string,
        userId?: number,
        since?: string,
    ): Promise<PageDto<AdminAnalyticsEvent>> => {
        const params: Record<string, unknown> = { page, size, sortBy: 'createdAt', sortDir: 'desc' };
        if (eventType) params.eventType = eventType;
        if (userId) params.userId = userId;
        if (since) params.since = since;
        const res = await http.get<ApiResponse<PageDto<AdminAnalyticsEvent>>>('/admin/analytics', { params });
        return res.data.data;
    },

    deleteAnalyticsEvent: async (id: number): Promise<void> => {
        await http.delete(`/admin/analytics/${id}`);
    },

    getEventTypeStats: async (eventType: string): Promise<Record<string, unknown>> => {
        const res = await http.get<ApiResponse<Record<string, unknown>>>(`/admin/analytics/stats/${eventType}`);
        return res.data.data;
    },
};