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
    lyrics: string;      // текст построчно с \n
    chords: SongChord[]; // позиция аккордов
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors: unknown[];
}
