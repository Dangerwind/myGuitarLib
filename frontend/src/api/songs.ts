// src/api/songs.ts
import http from './http';
import { Song, SongChord, ApiResponse } from '../types';

export interface SongUpsert {
    artist: string;
    title: string;
    comment: string;
    lyrics: string;
    chords: SongChord[];
}

export interface ArtistTitleDto {
    id: number;
    artist: string;
    title: string;
}

export const songsApi = {
    getAll: async (
        q?: string,
        sortBy: 'artist' | 'title' = 'artist',
        dir: 'asc' | 'desc' = 'asc'
    ): Promise<ArtistTitleDto[]> => {
        const params = new URLSearchParams();
        if (q && q.trim()) params.set('q', q.trim());
        params.set('sortBy', sortBy);
        params.set('dir', dir);

        const response = await http.get<ApiResponse<ArtistTitleDto[]>>(
            `/song?${params.toString()}`
        );
        return response.data.data;
    },

    getById: async (id: number): Promise<Song> => {
        const response = await http.get<ApiResponse<Song>>(`/song/${id}`);
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
        await http.delete<ApiResponse<void>>(`/song/${id}`);
    },
};
