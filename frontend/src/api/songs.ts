// src/api/songs.ts

import axios from 'axios';
import http from './http';
import { Song, SongChord, ApiResponse } from '../types';

// Отдельный axios без авторизации и 401-редиректа — для публичных эндпоинтов
const publicHttp = axios.create({
    baseURL: '/api/v1',
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
});

export interface SongUpsert {
    artist: string;
    title: string;
    comment: string;
    lyrics: string;
    chords: SongChord[];
    scrollSpeed: number;
    fontSize: number;
    tonality: number | null;
}

export interface ArtistTitleDto {
    id: number;
    artist: string;
    title: string;
    comment?: string;
}

export const songsApi = {
    getAll: async (
        q?: string,
        sortBy: 'artist' | 'title' = 'artist',
        dir: 'asc' | 'desc' = 'asc'
    ): Promise<ArtistTitleDto[]> => {
        const params = new URLSearchParams();
        if (q) params.set('q', q.trim());
        params.set('sortBy', sortBy);
        params.set('dir', dir);
        const response = await http.get<ApiResponse<ArtistTitleDto[]>>(
            `/song?${params.toString()}`
        );
        return response.data.data;
    },

    getById: async (id: number, ton?: number): Promise<Song> => {
        const params = ton !== undefined ? { ton } : {};
        const response = await http.get<ApiResponse<Song>>(`/song/${id}`, { params });
        return response.data.data;
    },

    create: async (data: SongUpsert): Promise<Song> => {
        const response = await http.post<ApiResponse<Song>>('/song', data);
        return response.data.data;
    },

    update: async (id: number, data: SongUpsert): Promise<Song> => {
        const response = await http.put<ApiResponse<Song>>(`/song/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await http.delete(`/song/${id}`);
    },

    importSong: async (data: {
        artist: string;
        title: string;
        rawText: string
    }): Promise<Song> => {
        const response = await http.post<ApiResponse<Song>>('/song/parse', data);
        return response.data.data;
    },

    // ── Поделиться ───────────────────────────────────────────────────────────

    /** Получить подписанный токен для публичной ссылки (требует авторизации). */
    getShareToken: async (id: number): Promise<string> => {
        const response = await http.get<ApiResponse<{ token: string }>>(`/song/${id}/share-token`);
        return response.data.data.token;
    },

    /** Получить песню по публичному токену (без авторизации). */
    getByShareToken: async (token: string): Promise<Song> => {
        const response = await publicHttp.get<ApiResponse<Song>>('/public/song', {
            params: { token },
        });
        return response.data.data;
    },

    /** Скопировать песню в свою библиотеку по токену (требует авторизации). */
    copyFromShare: async (token: string): Promise<Song> => {
        const response = await http.post<ApiResponse<Song>>('/song/copy', null, {
            params: { token },
        });
        return response.data.data;
    },
};