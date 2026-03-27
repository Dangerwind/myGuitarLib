// src/pages/SharedSongPage.tsx
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { songsApi } from '../api/songs';
import { Song, SongChord } from '../types';
import { useWakeLock } from '../hooks/useWakeLock';

/** Axios без 401-перехвата — используем только для /auth/me на публичной странице. */
const authCheckHttp = axios.create({ baseURL: '/api/v1', withCredentials: true });

export const SharedSongPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('t') ?? '';

    const [song, setSong]         = useState<Song | null>(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    const [copying, setCopying]   = useState(false);
    const [copied, setCopied]     = useState(false);
    const [copyError, setCopyError] = useState('');

    const [fontSize, setFontSize]         = useState(0);
    const [scrollSpeed, setScrollSpeed]   = useState(0);
    const scrollIntervalRef = useRef<number | null>(null);

    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

    // Экран не гаснет
    useWakeLock();

    // Загрузка песни по токену
    useEffect(() => {
        if (!token) {
            setError('Ссылка недействительна');
            setLoading(false);
            return;
        }
        songsApi.getByShareToken(token)
            .then(data => {
                setSong(data);
                setFontSize(data.fontSize ?? 0);
                setScrollSpeed(data.scrollSpeed ?? 0);
            })
            .catch(() => setError('Ссылка недействительна или устарела'))
            .finally(() => setLoading(false));
    }, [token]);

    // Проверяем авторизацию через /auth/me
    useEffect(() => {
        authCheckHttp.get<{ success: boolean }>('/auth/me')
            .then(res => setLoggedIn(res.data.success))
            .catch(() => setLoggedIn(false));
    }, []);

    // Автопрокрутка
    useEffect(() => {
        if (scrollIntervalRef.current !== null) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
        if (scrollSpeed === 0) return;
        scrollIntervalRef.current = window.setInterval(() => window.scrollBy(0, 1), 500 / scrollSpeed);
        return () => {
            if (scrollIntervalRef.current !== null) clearInterval(scrollIntervalRef.current);
        };
    }, [scrollSpeed]);

    const lines = useMemo(() => (song ? song.lyrics.split('\n') : []), [song]);

    const chordsByLine = useMemo(() => {
        const map = new Map<number, SongChord[]>();
        if (song?.chords) {
            song.chords.forEach(ch => {
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

    const getFontSizeClass = () => {
        const sizeMap: Record<number, string> = {
            '-3': 'text-xs', '-2': 'text-xs md:text-sm', '-1': 'text-sm md:text-base',
            '0': 'text-sm md:text-base', '1': 'text-base md:text-lg',
            '2': 'text-lg md:text-xl', '3': 'text-xl md:text-2xl',
            '4': 'text-2xl md:text-3xl', '5': 'text-3xl md:text-4xl',
        };
        return sizeMap[fontSize] || 'text-sm md:text-base';
    };

    const handleCopy = async () => {
        if (!token) return;
        setCopying(true);
        setCopyError('');
        try {
            await songsApi.copyFromShare(token);
            setCopied(true);
        } catch {
            setCopyError('Не удалось сохранить песню. Попробуй ещё раз.');
        } finally {
            setCopying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    if (error || !song) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100 flex items-center justify-center p-4">
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">🔗</div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Ссылка недействительна</h2>
                    <p className="text-slate-500 text-sm mb-6">{error || 'Песня не найдена'}</p>
                    <Link to="/login" className="btn btn-primary btn-sm">
                        Войти в приложение
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100">

            {/* ── Единая шапка ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-sky-500 to-indigo-500 shadow-md">
                <div className="px-3 py-2 flex items-center justify-between gap-2">

                    {/* Логотип */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 rounded-xl border-2 border-white/60 flex items-center justify-center">
                            <span className="text-base">🎸</span>
                        </div>
                        <span className="text-sm font-semibold text-white hidden md:block">
                            Хранитель песен
                        </span>
                    </div>

                    {/* Контролы шрифта и скорости */}
                    <div className="flex items-center gap-2">
                        <div className="bg-white/15 rounded-lg px-2 py-1 flex items-center gap-1">
                            <span className="text-xs font-semibold text-white/80 hidden lg:inline">Шрифт</span>
                            <button className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                                    onClick={() => setFontSize(p => Math.max(p - 1, -3))} disabled={fontSize <= -3}>−</button>
                            <span className="text-xs font-bold text-white w-6 text-center">
                                {fontSize > 0 ? `+${fontSize}` : fontSize}
                            </span>
                            <button className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                                    onClick={() => setFontSize(p => Math.min(p + 1, 5))} disabled={fontSize >= 5}>+</button>
                        </div>

                        <div className="bg-white/15 rounded-lg px-2 py-1 flex items-center gap-1">
                            <span className="text-xs font-semibold text-white/80 hidden lg:inline">Скорость</span>
                            <button className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                                    onClick={() => setScrollSpeed(p => Math.max(p - 1, 0))} disabled={scrollSpeed <= 0}>−</button>
                            <span className="text-xs font-bold text-white w-6 text-center">{scrollSpeed}</span>
                            <button className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                                    onClick={() => setScrollSpeed(p => Math.min(p + 1, 20))} disabled={scrollSpeed >= 20}>+</button>
                        </div>
                    </div>

                    {/* Кнопки авторизации / сохранения */}
                    <div className="flex items-center gap-1 shrink-0">
                        {loggedIn === null ? (
                            <span className="loading loading-spinner loading-xs text-white/70" />
                        ) : loggedIn ? (
                            copied ? (
                                <>
                                    <span className="text-xs font-medium text-emerald-200 hidden sm:inline">✓ Сохранено!</span>
                                    <Link to="/songs" className="btn btn-xs h-7 min-h-0 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                                        Мои песни →
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {copyError && <span className="text-xs text-red-200 hidden sm:inline">{copyError}</span>}
                                    <button
                                        className="btn btn-xs h-7 min-h-0 px-2 text-xs bg-white text-indigo-600 hover:bg-sky-50 border-0 font-semibold"
                                        onClick={handleCopy}
                                        disabled={copying}
                                    >
                                        {copying
                                            ? <span className="loading loading-spinner loading-xs" />
                                            : <><span className="hidden sm:inline">＋ Сохранить</span><span className="sm:hidden">＋</span></>
                                        }
                                    </button>
                                    <Link to="/songs" className="btn btn-xs h-7 min-h-0 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-0 hidden md:flex">
                                        Мои песни
                                    </Link>
                                </>
                            )
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-xs h-7 min-h-0 px-2 text-xs bg-white text-indigo-600 hover:bg-sky-50 border-0 font-semibold hidden sm:flex">
                                    Регистрация
                                </Link>
                                <Link to="/login" className="btn btn-xs h-7 min-h-0 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                                    Войти
                                </Link>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Контент ──────────────────────────────────────────────────── */}
            <div className="w-full px-4 py-4">
                <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl px-4 py-3 mb-4 shadow-sm">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900">{song.title}</h1>
                    <h2 className="text-base md:text-lg text-slate-600">{song.artist}</h2>
                    {song.comment && (
                        <p className="text-sm text-slate-500 mt-1 italic">{song.comment}</p>
                    )}
                </div>

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

                {/* Нижний CTA для незалогиненных */}
                {loggedIn === false && (
                    <div className="mt-10 rounded-2xl overflow-hidden shadow-lg">
                        <div className="bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-8 text-center text-white">
                            <div className="text-4xl mb-3">🎸</div>
                            <h3 className="text-xl font-bold mb-2">
                                Собирай любимые песни в одном месте
                            </h3>
                            <p className="text-sky-100 text-sm mb-6">
                                Собери свой репертуар и играй, как тебе удобно.
                            </p>
                            <div className="flex gap-3 justify-center flex-wrap">
                                <Link to="/register"
                                      className="btn bg-white text-indigo-600 hover:bg-sky-50 border-0 font-bold shadow-md">
                                    Создать бесплатный аккаунт
                                </Link>
                                <Link to="/login"
                                      className="btn bg-white/20 hover:bg-white/30 text-white border-white/30">
                                    Уже есть аккаунт
                                </Link>
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md px-6 py-4 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5">✅ Бесплатно навсегда</span>
                            <span className="flex items-center gap-1.5">🎵 Неограниченно песен</span>
                            <span className="flex items-center gap-1.5">💻 Работает на любом устройстве</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};