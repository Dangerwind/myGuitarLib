// src/pages/SongEditPage.tsx
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { songsApi, SongUpsert } from '../api/songs';
import { authApi } from '../api/auth';
import { Song, SongChord } from '../types';

export const SongEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id && id !== 'new';

    // Поля песни
    const [artist, setArtist] = useState('');
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [chordLines, setChordLines] = useState<string[]>([]);
    const [newLineChords, setNewLineChords] = useState('');
    const [newLineText, setNewLineText] = useState('');
    const [scrollSpeed, setScrollSpeed] = useState(0);
    const [fontSize, setFontSize] = useState(0);

    // Тональность = параметр ton
    const [tonality, setTonality] = useState(0);

    // Состояние
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');

    // Изменения (кроме тональности)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPristine, setIsPristine] = useState(true);

    // Модалка смены тональности
    const [showTonalityModal, setShowTonalityModal] = useState(false);
    const [pendingTonality, setPendingTonality] = useState<number | null>(null);

    // Модалка импорта
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');

    const textLines = useMemo(() => lyrics.split('\n'), [lyrics]);

    // Синхронизация chordLines
    useEffect(() => {
        setChordLines((prev) => {
            const next = [...prev];
            if (textLines.length > next.length) {
                while (next.length < textLines.length) next.push('');
            } else if (textLines.length < next.length) {
                next.length = textLines.length;
            }
            return next;
        });
    }, [textLines.length]);

    // Фиксация изменений
    useEffect(() => {
        if (!initialLoading && !isPristine) {
            setHasUnsavedChanges(true);
        }
    }, [artist, title, comment, lyrics, chordLines, scrollSpeed, fontSize, initialLoading, isPristine]);

    // Загрузка песни с учётом ton
    const loadSong = async (ton: number) => {
        if (!isEdit || !id) {
            setInitialLoading(false);
            return;
        }
        setInitialLoading(true);
        setLoading(true);
        setError('');
        try {
            const song: Song = await songsApi.getById(
                Number(id),
                ton === 0 ? undefined : ton
            );

            setArtist(song.artist);
            setTitle(song.title);
            setComment(song.comment ?? '');
            setLyrics(song.lyrics);
            setScrollSpeed(song.scrollSpeed ?? 0);
            setFontSize(song.fontSize ?? 0);

            const lines = song.lyrics.split('\n');
            const chordsByLine: string[] = Array(lines.length).fill('');
            song.chords.forEach((ch) => {
                const current = chordsByLine[ch.lineIndex] ?? '';
                let res = current;
                const pos = Math.max(ch.charIndex, res.length);
                if (pos > res.length) res += ' '.repeat(pos - res.length);
                res += ch.chord;
                chordsByLine[ch.lineIndex] = res;
            });
            setChordLines(chordsByLine);

            setTonality(ton);
            setHasUnsavedChanges(false);
            setIsPristine(true);
        } catch {
            setError('Не удалось загрузить песню');
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        if (isEdit && id) {
            loadSong(0);
        } else {
            setInitialLoading(false);
        }
    }, [id, isEdit]);

    // Logout по событию
    useEffect(() => {
        const handleLogoutEvent = () => navigate('/login');
        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, [navigate]);

    const buildChordsArray = (allChordLines: string[]): SongChord[] => {
        const result: SongChord[] = [];
        allChordLines.forEach((line, lineIndex) => {
            let i = 0;
            while (i < line.length) {
                while (i < line.length && line[i] === ' ') i++;
                if (i >= line.length) break;
                const start = i;
                while (i < line.length && line[i] !== ' ') i++;
                const chord = line.slice(start, i);
                result.push({ id: 0, lineIndex, charIndex: start, chord });
            }
        });
        return result;
    };

    const appendNewLineIfNeeded = () => {
        const text = newLineText.trimEnd();
        if (!text) {
            return { finalLyrics: lyrics, finalChordLines: chordLines };
        }
        const newLyricsLines = lyrics ? [...textLines, text] : [text];
        const finalLyrics = newLyricsLines.join('\n');
        const extendedChordLines =
            chordLines.length < newLyricsLines.length
                ? [...chordLines, newLineChords]
                : chordLines;
        return { finalLyrics, finalChordLines: extendedChordLines };
    };

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        setError('');
        setLoading(true);

        const { finalLyrics, finalChordLines } = appendNewLineIfNeeded();

        const payload: SongUpsert = {
            artist,
            title,
            comment,
            lyrics: finalLyrics,
            chords: buildChordsArray(finalChordLines),
            scrollSpeed,
            fontSize,
            tonality: null,
        };

        try {
            if (isEdit && id) {
                const updated = await songsApi.update(Number(id), payload);
                setHasUnsavedChanges(false);
                setIsPristine(true);
                navigate(`/songs/${updated.id}`);
            } else {
                const created = await songsApi.create(payload);
                setHasUnsavedChanges(false);
                setIsPristine(true);
                navigate(`/songs/${created.id}`);
            }
        } catch {
            setError('Не удалось сохранить песню');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            if (!window.confirm('Есть несохранённые изменения. Выйти без сохранения?')) return;
        }
        if (isEdit && id) navigate(`/songs/${id}`);
        else navigate('/songs');
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate('/login');
        } catch {
            navigate('/login');
        }
    };

    // ===== смена тональности =====

    const requestTonalityChange = (newTonality: number) => {
        if (!isEdit || !id) return;
        if (!hasUnsavedChanges) {
            setTonality(newTonality);
            loadSong(newTonality);
            return;
        }
        setPendingTonality(newTonality);
        setShowTonalityModal(true);
    };

    const handleTonalityModalSave = async () => {
        if (!isEdit || !id || pendingTonality == null) {
            setShowTonalityModal(false);
            setPendingTonality(null);
            return;
        }

        setError('');
        setLoading(true);

        const { finalLyrics, finalChordLines } = appendNewLineIfNeeded();
        const payload: SongUpsert = {
            artist,
            title,
            comment,
            lyrics: finalLyrics,
            chords: buildChordsArray(finalChordLines),
            scrollSpeed,
            fontSize,
            tonality: null,
        };

        try {
            await songsApi.update(Number(id), payload);
            setHasUnsavedChanges(false);
            setIsPristine(true);

            setTonality(pendingTonality);
            await loadSong(pendingTonality);
        } catch {
            setError('Не удалось сохранить песню');
        } finally {
            setLoading(false);
            setShowTonalityModal(false);
            setPendingTonality(null);
        }
    };

    const handleTonalityModalCancel = async () => {
        if (!isEdit || !id || pendingTonality == null) {
            setShowTonalityModal(false);
            setPendingTonality(null);
            return;
        }
        setTonality(pendingTonality);
        await loadSong(pendingTonality);
        setShowTonalityModal(false);
        setPendingTonality(null);
    };

    const increaseTonality = () => requestTonalityChange(Math.min(tonality + 1, 12));
    const decreaseTonality = () => requestTonalityChange(Math.max(tonality - 1, -12));

    // ===== навигация по строкам =====

    const markChanged = () => {
        if (isPristine) setIsPristine(false);
    };

    const handleNewLineKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        isChordInput: boolean
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isChordInput) {
                const newTextInput = document.querySelector<HTMLInputElement>(
                    'input[data-type="new-text"]'
                );
                if (newTextInput) {
                    newTextInput.focus();
                    newTextInput.setSelectionRange(0, 0);
                }
            } else {
                const text = newLineText.trimEnd();
                if (!text) return;
                markChanged();
                const arr = [...textLines, text];
                setLyrics(arr.join('\n'));
                setChordLines((prev) => [...prev, newLineChords]);
                setNewLineText('');
                setNewLineChords('');
                setTimeout(() => {
                    const newChordInput = document.querySelector<HTMLInputElement>(
                        'input[data-type="new-chord"]'
                    );
                    if (newChordInput) {
                        newChordInput.focus();
                        newChordInput.setSelectionRange(0, 0);
                    }
                }, 0);
            }
        }
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        lineIndex: number,
        isChordInput: boolean
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isChordInput) {
                const currentTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex}"][data-type="text"]`
                );
                if (currentTextInput) {
                    currentTextInput.focus();
                    currentTextInput.setSelectionRange(0, 0);
                }
            } else if (lineIndex < textLines.length - 1) {
                const nextChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex + 1}"][data-type="chord"]`
                );
                if (nextChordInput) {
                    nextChordInput.focus();
                    nextChordInput.setSelectionRange(0, 0);
                }
            } else {
                const newChordInput = document.querySelector<HTMLInputElement>(
                    'input[data-type="new-chord"]'
                );
                if (newChordInput) {
                    newChordInput.focus();
                    newChordInput.setSelectionRange(0, 0);
                }
            }
        }
    };

    const increaseScrollSpeed = () =>
        setScrollSpeed((prev) => Math.min(prev + 1, 20));
    const decreaseScrollSpeed = () =>
        setScrollSpeed((prev) => Math.max(prev - 1, 0));
    const increaseFontSize = () =>
        setFontSize((prev) => Math.min(prev + 1, 5));
    const decreaseFontSize = () =>
        setFontSize((prev) => Math.max(prev - 1, -3));

    // ===== импорт из буфера =====

    const openImportModal = () => {
        setImportError('');
        setImportText('');
        setShowImportModal(true);
    };

    const handleImportSubmit = async () => {
        if (!importText.trim()) {
            setImportError('Вставьте текст песни для импорта.');
            return;
        }

        setImportLoading(true);
        setImportError('');

        try {
            const song = await songsApi.importSong({
                artist: artist.trim(),
                title: title.trim(),
                rawText: importText,
            });
            setShowImportModal(false);
            setImportLoading(false);
            navigate(`/songs/${song.id}/edit`);
        } catch {
            setImportLoading(false);
            setImportError('Не удалось импортировать песню');
        }
    };

    if (initialLoading && isEdit) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
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
                        {/* Кнопка импорта только в режиме добавления */}
                        {!isEdit && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden md:flex"
                                onClick={openImportModal}
                                title="Импортировать песню из буфера"
                            >
                                📥 Импорт из буфера
                            </button>
                        )}
                        {!isEdit && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs md:hidden"
                                onClick={openImportModal}
                                title="Импортировать песню из буфера"
                            >
                                📥
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            onClick={handleCancel}
                            title="Отменить изменения"
                        >
                            ← Отменить
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            onClick={handleCancel}
                            title="Отменить изменения"
                        >
                            ←
                        </button>

                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            onClick={() => handleSubmit()}
                            disabled={loading}
                            title="Сохранить песню"
                        >
                            💾 {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            onClick={() => handleSubmit()}
                            disabled={loading}
                            title="Сохранить песню"
                        >
                            💾
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

            {/* Main */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">
                    {isEdit ? 'Редактировать песню' : 'Добавить песню'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Основная информация */}
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-slate-700 w-24 shrink-0">
                                    Исполнитель
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered input-sm flex-1 h-9"
                                    value={artist}
                                    onChange={(e) => {
                                        markChanged();
                                        setArtist(e.target.value);
                                    }}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-semibold text-slate-700 w-24 shrink-0">
                                    Название
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered input-sm flex-1 h-9"
                                    value={title}
                                    onChange={(e) => {
                                        markChanged();
                                        setTitle(e.target.value);
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-slate-700 w-24 shrink-0">
                                Комментарий
                            </label>
                            <input
                                type="text"
                                className="input input-bordered input-sm flex-1 h-9"
                                value={comment}
                                onChange={(e) => {
                                    markChanged();
                                    setComment(e.target.value);
                                }}
                                placeholder="необязательно"
                            />
                        </div>
                    </div>

                    {/* Настройки отображения */}
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Шрифт */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1 border border-blue-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Шрифт</span>
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

                            {/* Скорость */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg px-2 py-1 border border-emerald-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Скорость</span>
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

                            {/* Тональность */}
                            {isEdit && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg px-2 py-1 border border-amber-100 flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">Тональность</span>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                        onClick={decreaseTonality}
                                    >
                                        −
                                    </button>
                                    <span className="text-xs font-bold text-amber-600 w-7 text-center">
                    {tonality > 0 ? `+${tonality}` : tonality}
                  </span>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0"
                                        onClick={increaseTonality}
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Текст и аккорды */}
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            Текст и аккорды
                        </h3>

                        <div className="space-y-0">
                            {textLines.map((line, index) => (
                                <div key={index}>
                                    <input
                                        type="text"
                                        className="input w-full font-mono text-xs h-8 rounded-none border-x-0 border-t-0 border-b bg-base-200 focus:outline-none focus:bg-base-300"
                                        value={chordLines[index] || ''}
                                        onChange={(e) => {
                                            markChanged();
                                            const next = [...chordLines];
                                            next[index] = e.target.value;
                                            setChordLines(next);
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, index, true)}
                                        data-line={index}
                                        data-type="chord"
                                        placeholder="аккорды..."
                                    />
                                    <input
                                        type="text"
                                        className="input w-full font-mono text-xs h-8 rounded-none border-x-0 border-t-0 border-b focus:outline-none focus:bg-base-100"
                                        value={line}
                                        onChange={(e) => {
                                            markChanged();
                                            const arr = [...textLines];
                                            arr[index] = e.target.value;
                                            setLyrics(arr.join('\n'));
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, index, false)}
                                        data-line={index}
                                        data-type="text"
                                        placeholder="текст..."
                                    />
                                </div>
                            ))}

                            {/* Новая строка */}
                            <div className="pt-2 border-t-2 border-slate-300">
                                <input
                                    type="text"
                                    className="input w-full font-mono text-xs h-8 rounded-none border-x-0 border-t-0 border-b bg-base-200 focus:outline-none focus:bg-base-300"
                                    value={newLineChords}
                                    onChange={(e) => {
                                        if (isPristine) setIsPristine(false);
                                        setNewLineChords(e.target.value);
                                    }}
                                    onKeyDown={(e) => handleNewLineKeyDown(e, true)}
                                    data-type="new-chord"
                                    placeholder="новые аккорды..."
                                />
                                <input
                                    type="text"
                                    className="input w-full font-mono text-xs h-8 rounded-none border-x-0 border-t-0 border-b focus:outline-none focus:bg-base-100"
                                    value={newLineText}
                                    onChange={(e) => {
                                        if (isPristine) setIsPristine(false);
                                        setNewLineText(e.target.value);
                                    }}
                                    onKeyDown={(e) => handleNewLineKeyDown(e, false)}
                                    data-type="new-text"
                                    placeholder="новый текст... (Enter для добавления строки)"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}
                </form>
            </div>

            {/* Модалка сохранения при смене тональности */}
            {showTonalityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🎵</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                    Сохранить изменения?
                                </h3>
                                <p className="text-sm text-slate-600 mb-1">
                                    Текст или аккорды были изменены. Сохранить перед изменением тональности?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                className="btn btn-ghost flex-1"
                                onClick={handleTonalityModalCancel}
                            >
                                Не сохранять
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary flex-1"
                                onClick={handleTonalityModalSave}
                            >
                                Сохранить и изменить тональность
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка импорта из буфера (только для добавления) */}
            {showImportModal && !isEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            Импорт песни из буфера
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">
                            Вставьте сюда монолитный текст песни с аккордами. Исполнитель и название берутся из полей сверху.
                        </p>
                        <textarea
                            className="textarea textarea-bordered w-full h-64 font-mono text-xs"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Вставьте текст песни..."
                        />
                        {importError && (
                            <div className="alert alert-error mt-3">
                                <span>⚠️</span>
                                <span>{importError}</span>
                            </div>
                        )}
                        <div className="flex gap-3 mt-4 justify-end">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    if (importLoading) return;
                                    setShowImportModal(false);
                                }}
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleImportSubmit}
                                disabled={importLoading}
                            >
                                {importLoading ? 'Импорт...' : 'Импортировать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
