// src/pages/SongViewPage.tsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { songsApi } from '../api/songs';
import { Song, SongChord } from '../types';
import { useWakeLock } from '../hooks/useWakeLock';

export const SongViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const [song, setSong] = useState<Song | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fontSize, setFontSize] = useState(0);
    const [scrollSpeed, setScrollSpeed] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [shareUrl, setShareUrl]               = useState('');
    const [showShareModal, setShowShareModal]   = useState(false);
    const [shareLoading, setShareLoading]       = useState(false);
    const [shareCopied, setShareCopied]         = useState(false);
    const navigate = useNavigate();
    const scrollIntervalRef = useRef<number | null>(null);

    // Экран не гаснет
    useWakeLock();

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

        const interval = 500 / scrollSpeed;

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

    const handleDelete = async () => {
        if (!id) return;
        try {
            await songsApi.delete(Number(id));
            navigate('/songs');
        } catch {
            setError('Не удалось удалить песню');
        }
    };

    const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 1, 5));
    const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 1, -3));
    const increaseScrollSpeed = () => setScrollSpeed((prev) => Math.min(prev + 1, 20));
    const decreaseScrollSpeed = () => setScrollSpeed((prev) => Math.max(prev - 1, 0));

    const handleShare = async () => {
        if (!id) return;
        setShareLoading(true);
        try {
            const token = await songsApi.getShareToken(Number(id));
            const url = `${window.location.origin}/shared?t=${token}`;
            setShareUrl(url);
            setShowShareModal(true);
        } catch {
            setError('Не удалось создать ссылку');
        } finally {
            setShareLoading(false);
        }
    };

    const handleCopyShareUrl = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        });
    };

    const fontSizeClass = useMemo(() => {
        const sizes: Record<number, string> = {
            '-3': 'text-xs',
            '-2': 'text-sm',
            '-1': 'text-base',
            0: 'text-lg',
            1: 'text-xl',
            2: 'text-2xl',
            3: 'text-3xl',
            4: 'text-4xl',
            5: 'text-5xl',
        };
        return sizes[fontSize] || 'text-lg';
    }, [fontSize]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (error || !song) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Песня не найдена'}</p>
                    <Link to="/songs" className="btn btn-primary">
                        Вернуться к списку
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100">
                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                        <Link
                            to="/songs"
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
                        >
                            <div className="w-9 h-9 rounded-xl border-2 border-slate-800 flex items-center justify-center">
                                <span className="text-lg">🎸</span>
                            </div>
                            <div className="text-sm md:text-base font-semibold text-slate-900 whitespace-nowrap">
                                Хранитель песен
                            </div>
                        </Link>

                        <div className="flex items-center gap-1 shrink-0">
                            {/* Font */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1 border border-blue-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                                    Шрифт
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                    onClick={decreaseFontSize}
                                    disabled={fontSize <= -3}
                                >
                                    −
                                </button>
                                <span className="text-xs font-bold text-indigo-600 w-7 text-center">
                                    {fontSize > 0 ? `+${fontSize}` : fontSize}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                    onClick={increaseFontSize}
                                    disabled={fontSize >= 5}
                                >
                                    +
                                </button>
                            </div>

                            {/* Speed */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg px-2 py-1 border border-emerald-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                                    Скорость
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                    onClick={decreaseScrollSpeed}
                                    disabled={scrollSpeed <= 0}
                                >
                                    −
                                </button>
                                <span className="text-xs font-bold text-emerald-600 w-7 text-center">
                                    {scrollSpeed}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                    onClick={increaseScrollSpeed}
                                    disabled={scrollSpeed >= 20}
                                >
                                    +
                                </button>
                            </div>

                            {/* Share */}
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden lg:flex"
                                onClick={handleShare}
                                disabled={shareLoading}
                                title="Поделиться песней"
                            >
                                📤 Поделиться
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs lg:hidden"
                                onClick={handleShare}
                                disabled={shareLoading}
                                title="Поделиться песней"
                            >
                                📤
                            </button>

                            {/* Edit */}
                            <Link
                                to={`/songs/${id}/edit`}
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden lg:flex"
                                title="Редактировать"
                            >
                                ✏️ Редактировать
                            </Link>
                            <Link
                                to={`/songs/${id}/edit`}
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs lg:hidden"
                                title="Редактировать"
                            >
                                ✏️
                            </Link>

                            {/* Delete */}
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
                        </div>
                    </div>
                </div>

                {/* Song content */}
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">
                            {song.title}
                        </h1>
                        <p className="text-slate-600 mb-4">{song.artist}</p>
                        {song.comment && (
                            <p className="text-sm text-slate-500 italic mb-4">{song.comment}</p>
                        )}

                        <div className={`font-mono ${fontSizeClass} leading-relaxed whitespace-pre-wrap`}>
                            {lines.map((line, lineIndex) => {
                                const chordsForLine = chordsByLine.get(lineIndex) ?? [];
                                return (
                                    <div key={lineIndex} className="mb-2">
                                        {chordsForLine.length > 0 && (
                                            <div className="text-blue-600 font-semibold">
                                                {chordsForLine.map((ch, idx) => {
                                                    const prevCharIndex =
                                                        idx > 0 ? chordsForLine[idx - 1].charIndex : 0;
                                                    const prevChordLength =
                                                        idx > 0 ? chordsForLine[idx - 1].chord.length : 0;
                                                    const gap = ch.charIndex - (prevCharIndex + prevChordLength);
                                                    return (
                                                        <span key={ch.id}>
                                                            {idx === 0 && ch.charIndex > 0 && (
                                                                <span style={{ display: 'inline-block', width: `${ch.charIndex}ch` }} />
                                                            )}
                                                            {idx > 0 && gap > 0 && (
                                                                <span style={{ display: 'inline-block', width: `${gap}ch` }} />
                                                            )}
                                                            {ch.chord}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="text-slate-900">{line || '\u00A0'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Удалить песню?
                                </h3>
                                <p className="text-sm text-slate-600">
                                    Это действие нельзя отменить. Песня будет удалена навсегда.
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

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">📤</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Поделиться песней
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    Скопируй ссылку и отправь другу. Он сможет посмотреть песню без регистрации.
                                </p>
                                <div className="bg-slate-100 rounded-lg p-3 border border-slate-200 break-all text-sm font-mono text-slate-700 mb-3">
                                    {shareUrl}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={() => {
                                    setShowShareModal(false);
                                    setShareCopied(false);
                                }}
                            >
                                Закрыть
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary flex-1"
                                onClick={handleCopyShareUrl}
                            >
                                {shareCopied ? '✓ Скопировано' : '📋 Копировать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Инструкция */}
            <a
                href="/instructions.html"
                target="_blank"
                rel="noopener noreferrer"
                title="Инструкция по использованию"
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: '700',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                    textDecoration: 'none',
                    zIndex: 50,
                    transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                        '0 6px 24px rgba(99,102,241,0.55)';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                        '0 4px 16px rgba(99,102,241,0.4)';
                }}
            >
                ?
            </a>
        </>
    );
};