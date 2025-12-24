// src/pages/SongViewPage.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { songsApi } from '../api/songs';
import { Song, SongChord } from '../types';
import { authApi } from '../api/auth';

export const SongViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fontSize, setFontSize] = useState(0);
    const [scrollSpeed, setScrollSpeed] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const navigate = useNavigate();
    const scrollIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const loadSong = async () => {
            if (!id) return;
            try {
                const data = await songsApi.getById(Number(id));
                setSong(data);
                setFontSize(data.fontSize ?? 0);
                setScrollSpeed(data.scrollSpeed ?? 0);
            } catch {
                setError('Failed to load song');
            } finally {
                setLoading(false);
            }
        };
        loadSong();
    }, [id]);

    useEffect(() => {
        const handleLogout = () => {
            navigate('/login');
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [navigate]);

    useEffect(() => {
        if (scrollIntervalRef.current !== null) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }

        if (scrollSpeed === 0) return;

        const interval = 1000 / scrollSpeed;

        scrollIntervalRef.current = window.setInterval(() => {
            window.scrollBy(0, 1);
        }, interval);

        return () => {
            if (scrollIntervalRef.current !== null) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        };
    }, [scrollSpeed]);

    const lines = useMemo(
        () => (song ? song.lyrics.split('\n') : []),
        [song]
    );

    const chordsByLine = useMemo(() => {
        const map = new Map<number, SongChord[]>();
        if (song?.chords) {
            song.chords.forEach((ch) => {
                const arr = map.get(ch.lineIndex) ?? [];
                arr.push(ch);
                map.set(ch.lineIndex, arr);
            });
            map.forEach((arr, key) => {
                arr.sort((a, b) => a.charIndex - b.charIndex);
                map.set(key, arr);
            });
        }
        return map;
    }, [song]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate('/login');
        } catch {
            navigate('/login');
        }
    };

    const handleDelete = async () => {
        if (!song) return;
        try {
            await songsApi.delete(song.id);
            navigate('/songs');
        } catch {
            setError('Не удалось удалить песню');
        }
        setShowDeleteModal(false);
    };

    const increaseFontSize = () => {
        setFontSize((prev) => Math.min(prev + 1, 5));
    };

    const decreaseFontSize = () => {
        setFontSize((prev) => Math.max(prev - 1, -3));
    };

    const increaseScrollSpeed = () => {
        setScrollSpeed((prev) => Math.min(prev + 1, 20));
    };

    const decreaseScrollSpeed = () => {
        setScrollSpeed((prev) => Math.max(prev - 1, 0));
    };

    const getFontSizeClass = () => {
        const sizeMap: Record<number, string> = {
            '-3': 'text-xs',
            '-2': 'text-xs md:text-sm',
            '-1': 'text-sm md:text-base',
            '0': 'text-sm md:text-base',
            '1': 'text-base md:text-lg',
            '2': 'text-lg md:text-xl',
            '3': 'text-xl md:text-2xl',
            '4': 'text-2xl md:text-3xl',
            '5': 'text-3xl md:text-4xl',
        };
        return sizeMap[fontSize] || 'text-sm md:text-base';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error || !song) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl border-2 border-slate-800 flex items-center justify-center">
                                <span className="text-lg">🎸</span>
                            </div>
                            <span className="text-lg font-semibold text-slate-900">
                Хранитель песен
              </span>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="alert alert-error mb-4">
                        <span>{error || 'Песня не найдена'}</span>
                    </div>
                    <Link to="/songs" className="btn btn-primary">
                        ← К списку песен
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="px-3 py-2 flex items-center justify-between gap-2">
                    {/* Логотип */}
                    <Link to="/songs" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                        <div className="w-9 h-9 rounded-xl border-2 border-slate-800 flex items-center justify-center">
                            <span className="text-lg">🎸</span>
                        </div>
                        <div className="text-sm md:text-base font-semibold text-slate-900 whitespace-nowrap">
                            Хранитель песен
                        </div>
                    </Link>

                    {/* Контролы размера и скорости */}
                    <div className="flex items-center gap-2">
                        {/* Контроль размера шрифта */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1 border border-blue-100 flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-700 hidden lg:inline">Шрифт</span>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-indigo-100 disabled:opacity-30"
                                onClick={decreaseFontSize}
                                disabled={fontSize <= -3}
                                title="Уменьшить размер шрифта"
                            >
                                −
                            </button>
                            <span className="text-xs font-bold text-indigo-600 w-6 text-center">
                {fontSize > 0 ? `+${fontSize}` : fontSize}
              </span>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-indigo-100 disabled:opacity-30"
                                onClick={increaseFontSize}
                                disabled={fontSize >= 5}
                                title="Увеличить размер шрифта"
                            >
                                +
                            </button>
                        </div>

                        {/* Контроль скорости прокрутки */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg px-2 py-1 border border-emerald-100 flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-700 hidden lg:inline">Скорость</span>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-emerald-100 disabled:opacity-30"
                                onClick={decreaseScrollSpeed}
                                disabled={scrollSpeed <= 0}
                                title="Уменьшить скорость прокрутки"
                            >
                                −
                            </button>
                            <span className="text-xs font-bold text-emerald-600 w-6 text-center">
                {scrollSpeed}
              </span>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-emerald-100 disabled:opacity-30"
                                onClick={increaseScrollSpeed}
                                disabled={scrollSpeed >= 20}
                                title="Увеличить скорость прокрутки"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Link
                            to="/songs"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            title="К списку песен"
                        >
                            ← К списку
                        </Link>
                        <Link
                            to="/songs"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            title="К списку песен"
                        >
                            ←
                        </Link>

                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            onClick={() => alert('Поделиться — в разработке')}
                            title="Поделиться песней"
                        >
                            📤 Поделиться
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            onClick={() => alert('Поделиться — в разработке')}
                            title="Поделиться песней"
                        >
                            📤
                        </button>

                        <Link
                            to={`/songs/${song.id}/edit`}
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            title="Редактировать песню"
                        >
                            ✏️ Редактировать
                        </Link>
                        <Link
                            to={`/songs/${song.id}/edit`}
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            title="Редактировать песню"
                        >
                            ✏️
                        </Link>

                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            onClick={() => setShowDeleteModal(true)}
                            title="Удалить песню"
                        >
                            🗑️ Удалить
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            onClick={() => setShowDeleteModal(true)}
                            title="Удалить песню"
                        >
                            🗑️
                        </button>

                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs"
                            onClick={handleLogout}
                            title="Выйти из аккаунта"
                        >
                            <span className="hidden lg:inline">Выйти</span>
                            <span className="lg:hidden">👤</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="w-full px-4 py-4">
                {/* Заголовок песни */}
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                        {song.title}
                    </h1>
                    <h2 className="text-base md:text-lg text-slate-600">
                        {song.artist}
                    </h2>
                    {song.comment && (
                        <p className="text-sm text-slate-500 mt-1 italic">{song.comment}</p>
                    )}
                </div>

                {/* Текст с аккордами */}
                <div className={`w-full font-mono ${getFontSizeClass()} leading-relaxed`}>
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
                        chords.forEach((ch) => {
                            const pos = Math.max(ch.charIndex, chordLine.length);
                            if (pos > chordLine.length) {
                                chordLine += ' '.repeat(pos - chordLine.length);
                            }
                            chordLine += ch.chord;
                        });

                        return (
                            <div key={index} className="whitespace-pre-wrap">
                                <div className="text-sky-700 font-bold whitespace-pre">
                                    {chordLine}
                                </div>
                                <div>{line || '\u00A0'}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🗑️</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Удалить песню?
                                </h3>
                                <p className="text-sm text-slate-600 mb-1">
                                    <span className="font-semibold">{song.artist} — {song.title}</span>
                                </p>
                                <p className="text-sm text-slate-500">
                                    Это действие нельзя будет отменить.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="btn btn-error flex-1"
                                onClick={handleDelete}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
