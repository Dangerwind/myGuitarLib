// src/pages/admin/AdminSongsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, AdminSongDto, PageDto } from '../../api/admin';
import { Song, SongChord } from '../../types';

// ── Мини-рендер аккордов (как в SongViewPage) ────────────────────────────────

const SongPreview = ({ song }: { song: Song }) => {
    const lines = useMemo(() => song.lyrics.split('\n'), [song]);

    const chordsByLine = useMemo(() => {
        const map = new Map<number, SongChord[]>();
        song.chords?.forEach(ch => {
            const arr = map.get(ch.lineIndex) ?? [];
            arr.push(ch);
            map.set(ch.lineIndex, arr);
        });
        map.forEach((arr, key) => {
            arr.sort((a, b) => a.charIndex - b.charIndex);
            map.set(key, arr);
        });
        return map;
    }, [song]);

    return (
        <div className="font-mono text-sm leading-relaxed">
            {lines.map((line, index) => {
                const chords = chordsByLine.get(index) ?? [];
                if (chords.length === 0) {
                    return (
                        <div key={index} className="whitespace-pre-wrap">
                            {line || '\u00A0'}
                        </div>
                    );
                }
                let chordLine = '';
                chords.forEach(ch => {
                    const pos = Math.max(ch.charIndex, chordLine.length);
                    if (pos > chordLine.length) chordLine += ' '.repeat(pos - chordLine.length);
                    chordLine += ch.chord;
                });
                return (
                    <div key={index} className="whitespace-pre-wrap">
                        <div className="text-sky-700 font-bold whitespace-pre">{chordLine}</div>
                        <div>{line || '\u00A0'}</div>
                    </div>
                );
            })}
        </div>
    );
};

// ── Модальное окно просмотра ─────────────────────────────────────────────────

const SongModal = ({ songId, onClose }: { songId: number; onClose: () => void }) => {
    const [song, setSong]       = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        adminApi.getSongById(songId)
            .then(setSong)
            .catch(() => setError('Не удалось загрузить песню'))
            .finally(() => setLoading(false));
    }, [songId]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8">
                <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
                    <div>
                        {loading ? (
                            <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
                        ) : song ? (
                            <>
                                <h2 className="text-lg font-bold text-slate-900">{song.title}</h2>
                                <p className="text-sm text-slate-500">{song.artist}</p>
                                {song.comment && (
                                    <p className="text-xs text-slate-400 italic mt-0.5">{song.comment}</p>
                                )}
                            </>
                        ) : (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm h-8 min-h-0 px-2 text-slate-400 hover:text-slate-600 shrink-0"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-md text-slate-400" />
                        </div>
                    ) : song ? (
                        <SongPreview song={song} />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

// ── Основная страница ─────────────────────────────────────────────────────────

export const AdminSongsPage = () => {
    const [data, setData]         = useState<PageDto<AdminSongDto> | null>(null);
    const [page, setPage]         = useState(0);
    const [sortBy, setSortBy]     = useState('id');
    const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewSongId, setPreviewSongId] = useState<number | null>(null);

    const load = (p: number, sb: string, sd: string) => {
        setLoading(true);
        setError('');
        adminApi.getAllSongs(p, 20, sb, sd)
            .then(setData)
            .catch(() => setError('Не удалось загрузить песни'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(page, sortBy, sortDir); }, [page, sortBy, sortDir]);

    const handleDelete = async (song: AdminSongDto) => {
        if (!confirm(`Удалить «${song.artist} — ${song.title}»?`)) return;
        setDeletingId(song.id);
        try {
            await adminApi.deleteSong(song.id);
            load(page, sortBy, sortDir);
        } catch {
            alert('Не удалось удалить песню');
        } finally {
            setDeletingId(null);
        }
    };

    const toggleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDir('asc');
        }
        setPage(0);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
        return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Песни</h1>
                {data && (
                    <span className="text-sm text-slate-500">
                        Всего: {data.totalItems.toLocaleString()}
                    </span>
                )}
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    <span>⚠️ {error}</span>
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-md text-slate-400" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60">
                                <th
                                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 cursor-pointer hover:text-slate-700"
                                    onClick={() => toggleSort('id')}
                                >
                                    ID <SortIcon field="id" />
                                </th>
                                <th
                                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => toggleSort('artist')}
                                >
                                    Исполнитель <SortIcon field="artist" />
                                </th>
                                <th
                                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => toggleSort('title')}
                                >
                                    Название <SortIcon field="title" />
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                                    Пользователь
                                </th>
                                <th className="px-4 py-3 w-16" />
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {data?.items.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        Песни не найдены
                                    </td>
                                </tr>
                            )}
                            {data?.items.map(song => (
                                <tr key={song.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 text-slate-400 text-xs">{song.id}</td>
                                    <td className="px-4 py-3 font-medium">
                                        <button
                                            className="text-left text-slate-900 hover:text-blue-600 transition-colors"
                                            onClick={() => setPreviewSongId(song.id)}
                                            title="Открыть песню"
                                        >
                                            {song.artist}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            className="text-left text-slate-700 hover:text-blue-600 transition-colors"
                                            onClick={() => setPreviewSongId(song.id)}
                                            title="Открыть песню"
                                        >
                                            {song.title}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                        <Link
                                            to={`/admin/users/${song.ownerId}`}
                                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            {song.ownerEmail}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="btn btn-ghost btn-xs h-6 min-h-0 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(song)}
                                            disabled={deletingId === song.id}
                                        >
                                            {deletingId === song.id
                                                ? <span className="loading loading-spinner loading-xs" />
                                                : '✕'
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {data && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-500">
                        Страница {page + 1} из {data.totalPages || 1}
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2"
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 0}
                        >
                            ← Назад
                        </button>
                        <button
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page + 1 >= data.totalPages}
                        >
                            Вперёд →
                        </button>
                    </div>
                </div>
            )}

            {previewSongId !== null && (
                <SongModal
                    songId={previewSongId}
                    onClose={() => setPreviewSongId(null)}
                />
            )}
        </div>
    );
};