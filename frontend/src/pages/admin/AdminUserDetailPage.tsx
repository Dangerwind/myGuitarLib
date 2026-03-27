// src/pages/admin/AdminUserDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminApi, AdminUserDetails, AdminSongDto, AdminAnalyticsEvent, PageDto } from '../../api/admin';
import { Song, SongChord } from '../../types';

// ── Лейблы событий ───────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
    USER_REGISTRATION: 'Регистрация', USER_LOGIN: 'Вход', USER_LOGOUT: 'Выход',
    SONG_VIEW: 'Просмотр', SONG_EDIT: 'Редактирование', SONG_CREATE: 'Создание',
    SONG_IMPORT: 'Импорт', SONG_DELETE: 'Удаление', SONG_TONALITY_CHANGE: 'Тональность',
    SONG_SEARCH: 'Поиск', PAGE_VIEW: 'Страница', SONG_SHARED_VIEW: '🔗 По ссылке',
};

const fmt = (iso: string) =>
    new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// ── Просмотр песни (модалка) ─────────────────────────────────────────────────

const SongPreview = ({ song }: { song: Song }) => {
    const lines = useMemo(() => song.lyrics.split('\n'), [song]);
    const chordsByLine = useMemo(() => {
        const map = new Map<number, SongChord[]>();
        song.chords?.forEach(ch => {
            const arr = map.get(ch.lineIndex) ?? [];
            arr.push(ch);
            map.set(ch.lineIndex, arr);
        });
        map.forEach((arr, key) => { arr.sort((a, b) => a.charIndex - b.charIndex); map.set(key, arr); });
        return map;
    }, [song]);

    return (
        <div className="font-mono text-sm leading-relaxed">
            {lines.map((line, index) => {
                const chords = chordsByLine.get(index) ?? [];
                if (chords.length === 0) return <div key={index} className="whitespace-pre-wrap">{line || '\u00A0'}</div>;
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
                        {loading
                            ? <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
                            : song ? (
                                <>
                                    <h2 className="text-lg font-bold text-slate-900">{song.title}</h2>
                                    <p className="text-sm text-slate-500">{song.artist}</p>
                                    {song.comment && <p className="text-xs text-slate-400 italic mt-0.5">{song.comment}</p>}
                                </>
                            ) : <p className="text-red-500 text-sm">{error}</p>
                        }
                    </div>
                    <button
                        className="btn btn-ghost btn-sm h-8 min-h-0 px-2 text-slate-400 hover:text-slate-600 shrink-0"
                        onClick={onClose}
                    >✕</button>
                </div>
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {loading
                        ? <div className="flex justify-center py-8"><span className="loading loading-spinner loading-md text-slate-400" /></div>
                        : song ? <SongPreview song={song} /> : null
                    }
                </div>
            </div>
        </div>
    );
};

// ── Страница пользователя ────────────────────────────────────────────────────

export const AdminUserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const userId = Number(id);

    const [details, setDetails]    = useState<AdminUserDetails | null>(null);
    const [songs, setSongs]         = useState<PageDto<AdminSongDto> | null>(null);
    const [events, setEvents]       = useState<PageDto<AdminAnalyticsEvent> | null>(null);
    const [songPage, setSongPage]   = useState(0);
    const [eventPage, setEventPage] = useState(0);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [deleting, setDeleting]   = useState(false);
    const [previewSongId, setPreviewSongId] = useState<number | null>(null);

    useEffect(() => {
        setLoading(true);
        adminApi.getUserDetails(userId)
            .then(setDetails)
            .catch(() => setError('Пользователь не найден'))
            .finally(() => setLoading(false));
    }, [userId]);

    useEffect(() => {
        adminApi.getUserSongs(userId, songPage, 10).then(setSongs).catch(() => {});
    }, [userId, songPage]);

    useEffect(() => {
        adminApi.getUserAnalytics(userId, eventPage, 10).then(setEvents).catch(() => {});
    }, [userId, eventPage]);

    const handleDeleteUser = async () => {
        if (!details) return;
        if (!confirm(`Удалить пользователя ${details.email}? Это действие нельзя отменить.`)) return;
        setDeleting(true);
        try {
            await adminApi.deleteUser(userId);
            navigate('/admin/users');
        } catch {
            alert('Не удалось удалить пользователя');
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-24">
            <span className="loading loading-spinner loading-lg text-slate-400" />
        </div>
    );

    if (error || !details) return (
        <div>
            <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
                ← Назад к пользователям
            </Link>
            <div className="alert alert-error"><span>⚠️ {error || 'Ошибка'}</span></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link to="/admin/users" className="text-blue-600 hover:text-blue-700">Пользователи</Link>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 truncate">{details.email}</span>
            </div>

            {/* Профиль */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-xl font-bold text-slate-900">{details.email}</h1>
                        {details.name && <div className="text-slate-600 text-sm">{details.name}</div>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                            <span>ID: <span className="font-medium text-slate-700">{details.id}</span></span>
                            <span>Роль: <span className="font-medium text-slate-700">{details.role}</span></span>
                            <span>Зарег.: <span className="font-medium text-slate-700">{fmt(details.createdAt)}</span></span>
                            <span>Обновлён: <span className="font-medium text-slate-700">{fmt(details.updatedAt)}</span></span>
                        </div>
                    </div>
                    <button
                        className="btn btn-error btn-sm h-8 min-h-0 text-xs shrink-0"
                        onClick={handleDeleteUser}
                        disabled={deleting}
                    >
                        {deleting ? <span className="loading loading-spinner loading-xs" /> : '🗑 Удалить пользователя'}
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
                    <div>
                        <div className="text-xs text-slate-500">Песен</div>
                        <div className="text-2xl font-extrabold text-slate-900">{details.totalSongs}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Событий всего</div>
                        <div className="text-2xl font-extrabold text-slate-900">{details.totalEvents}</div>
                    </div>
                </div>
            </div>

            {/* Последние события (топ-10 из профиля) */}
            {details.lastEvents && details.lastEvents.length > 0 && (
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-slate-800">Последние 10 событий</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {details.lastEvents.map(e => (
                            <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-700">
                                        {EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}
                                    </span>
                                    {e.deviceType && <span className="text-xs text-slate-400 hidden sm:inline">· {e.deviceType}</span>}
                                    {e.browser && <span className="text-xs text-slate-400 hidden sm:inline">· {e.browser}</span>}
                                </div>
                                <span className="text-xs text-slate-400 shrink-0 ml-2">{fmt(e.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Песни пользователя */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">Песни</h2>
                    {songs && <span className="text-xs text-slate-400">Всего: {songs.totalItems}</span>}
                </div>
                {!songs ? (
                    <div className="flex justify-center py-6">
                        <span className="loading loading-spinner loading-sm text-slate-400" />
                    </div>
                ) : songs.items.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-400">Нет песен</div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100">
                            {songs.items.map(song => (
                                <div key={song.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                                    <button
                                        className="text-sm text-left text-slate-700 hover:text-blue-600 transition-colors flex-1"
                                        onClick={() => setPreviewSongId(song.id)}
                                        title="Открыть песню"
                                    >
                                        <span className="font-medium">{song.artist}</span>
                                        <span className="text-slate-400"> — </span>
                                        {song.title}
                                    </button>
                                    <span className="text-xs text-slate-400 ml-2 shrink-0">#{song.id}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
                            <span className="text-xs text-slate-400">{songPage + 1} / {songs.totalPages || 1}</span>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost btn-xs h-6 min-h-0 px-2"
                                        onClick={() => setSongPage(p => p - 1)} disabled={songPage === 0}>←</button>
                                <button className="btn btn-ghost btn-xs h-6 min-h-0 px-2"
                                        onClick={() => setSongPage(p => p + 1)} disabled={songPage + 1 >= songs.totalPages}>→</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Аналитика пользователя */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-800">Аналитика</h2>
                    {events && <span className="text-xs text-slate-400">Всего: {events.totalItems}</span>}
                </div>
                {!events ? (
                    <div className="flex justify-center py-6">
                        <span className="loading loading-spinner loading-sm text-slate-400" />
                    </div>
                ) : events.items.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-400">Нет событий</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/60">
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Тип события</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Устройство</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Браузер</th>
                                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Дата</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {events.items.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2.5 text-slate-700">{EVENT_TYPE_LABELS[e.eventType] ?? e.eventType}</td>
                                        <td className="px-4 py-2.5 text-slate-500 hidden sm:table-cell">{e.deviceType || '—'}</td>
                                        <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{e.browser || '—'}</td>
                                        <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{fmt(e.createdAt)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100">
                            <span className="text-xs text-slate-400">{eventPage + 1} / {events.totalPages || 1}</span>
                            <div className="flex gap-1">
                                <button className="btn btn-ghost btn-xs h-6 min-h-0 px-2"
                                        onClick={() => setEventPage(p => p - 1)} disabled={eventPage === 0}>←</button>
                                <button className="btn btn-ghost btn-xs h-6 min-h-0 px-2"
                                        onClick={() => setEventPage(p => p + 1)} disabled={eventPage + 1 >= events.totalPages}>→</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Модальное окно просмотра песни */}
            {previewSongId !== null && (
                <SongModal songId={previewSongId} onClose={() => setPreviewSongId(null)} />
            )}
        </div>
    );
};

export default AdminUserDetailPage;