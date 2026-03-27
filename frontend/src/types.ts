// src/types.ts
export interface SongChord {
    id: number;
    lineIndex: number;
    charIndex: number;
    chord: string;
}

export interface Song {
    id: number;
    artist: string;
    title: string;
    comment: string;
    lyrics: string;
    chords: SongChord[];
    fontSize?: number;
    scrollSpeed?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors: unknown[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    name: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        role: 'ADMIN' | 'USER';
        email: string;
        name?: string;
    };
    errors: unknown[];
}