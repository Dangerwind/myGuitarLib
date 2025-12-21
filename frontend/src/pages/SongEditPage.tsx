// src/pages/SongEditPage.tsx
import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { songsApi, SongUpsert } from '../api/songs';
import { authApi } from '../api/auth';
import { Song, SongChord } from '../types';

export const SongEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id && id !== 'new';

    const [artist, setArtist] = useState('');
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [chordLines, setChordLines] = useState<string[]>([]);
    const [newLineChords, setNewLineChords] = useState('');
    const [newLineText, setNewLineText] = useState('');
    const [scrollSpeed, setScrollSpeed] = useState(0);
    const [fontSize, setFontSize] = useState(0);
    const [tonality, setTonality] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const textLines = useMemo(() => lyrics.split('\n'), [lyrics]);

    useEffect(() => {
        setChordLines((prev) => {
            const next = [...prev];
            if (textLines.length > next.length) {
                while (next.length < textLines.length) {
                    next.push('');
                }
            } else if (textLines.length < next.length) {
                next.length = textLines.length;
            }
            return next;
        });
    }, [textLines.length]);

    useEffect(() => {
        const load = async () => {
            if (!isEdit || !id) return;
            setLoading(true);
            try {
                const song: Song = await songsApi.getById(Number(id));
                setArtist(song.artist);
                setTitle(song.title);
                setComment(song.comment ?? '');
                setLyrics(song.lyrics);
                setScrollSpeed(song.scrollSpeed ?? 0);
                setFontSize(song.fontSize ?? 0);
                setTonality(song.tonality ?? 0);

                const lines = song.lyrics.split('\n');
                const chordsByLine: string[] = Array(lines.length).fill('');
                song.chords.forEach((ch) => {
                    const current = chordsByLine[ch.lineIndex] ?? '';
                    let res = current;
                    const pos = Math.max(ch.charIndex, res.length);
                    if (pos > res.length) {
                        res += ' '.repeat(pos - res.length);
                    }
                    res += ch.chord;
                    chordsByLine[ch.lineIndex] = res;
                });
                setChordLines(chordsByLine);
            } catch {
                setError('Не удалось загрузить песню');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit]);

    useEffect(() => {
        const handleLogout = () => {
            navigate('/login');
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
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
                result.push({
                    id: 0,
                    lineIndex,
                    charIndex: start,
                    chord,
                });
            }
        });
        return result;
    };

    const appendNewLineIfNeeded = () => {
        const text = newLineText.trimEnd();
        if (!text) {
            return {
                finalLyrics: lyrics,
                finalChordLines: chordLines,
            };
        }

        const newLyricsLines = lyrics ? [...textLines, text] : [text];
        const finalLyrics = newLyricsLines.join('\n');

        const extendedChordLines =
            chordLines.length < newLyricsLines.length
                ? [...chordLines, newLineChords]
                : chordLines;

        return {
            finalLyrics,
            finalChordLines: extendedChordLines,
        };
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
            tonality: tonality === 0 ? null : tonality,
        };

        try {
            if (isEdit && id) {
                const updated = await songsApi.update(Number(id), payload);
                navigate(`/songs/${updated.id}`);
            } else {
                const created = await songsApi.create(payload);
                navigate(`/songs/${created.id}`);
            }
        } catch {
            setError('Не удалось сохранить песню');
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (isEdit && id) {
            navigate(`/songs/${id}`);
        } else {
            navigate('/songs');
        }
    };

    const handleNewLineKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isChordInput: boolean) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (isChordInput) {
                // Enter в поле "новые аккорды" - переход в поле "новый текст" (ниже)
                const newTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-type="new-text"]`
                );
                if (newTextInput) {
                    newTextInput.focus();
                    newTextInput.setSelectionRange(0, 0);
                }
            } else {
                // Enter в поле "новый текст" - добавляем строку и переходим в новое поле аккордов
                const text = newLineText.trimEnd();
                if (!text) return;

                const arr = [...textLines, text];
                setLyrics(arr.join('\n'));
                setChordLines((prev) => [...prev, newLineChords]);
                setNewLineText('');
                setNewLineChords('');

                // Курсор переходит в поле "новые аккорды"
                setTimeout(() => {
                    const newChordInput = document.querySelector<HTMLInputElement>(
                        `input[data-type="new-chord"]`
                    );
                    if (newChordInput) {
                        newChordInput.focus();
                        newChordInput.setSelectionRange(0, 0);
                    }
                }, 0);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const cursorPosition = e.currentTarget.selectionStart || 0;

            if (isChordInput && textLines.length > 0) {
                // Из новой строки аккордов в последнюю строку текста
                const lastTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${textLines.length - 1}"][data-type="text"]`
                );
                if (lastTextInput) {
                    lastTextInput.focus();
                    lastTextInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            } else if (!isChordInput) {
                // Из новой строки текста в новую строку аккордов
                const newChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-type="new-chord"]`
                );
                if (newChordInput) {
                    newChordInput.focus();
                    newChordInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const cursorPosition = e.currentTarget.selectionStart || 0;

            if (isChordInput) {
                // Из новой строки аккордов в новую строку текста
                const newTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-type="new-text"]`
                );
                if (newTextInput) {
                    newTextInput.focus();
                    newTextInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
            // Из новой строки текста вниз никуда не идём (это последнее поле)
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, lineIndex: number, isChordInput: boolean) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Переход на следующую строку
            if (isChordInput) {
                // Из аккордов в текст той же строки
                const currentTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex}"][data-type="text"]`
                );
                if (currentTextInput) {
                    currentTextInput.focus();
                    currentTextInput.setSelectionRange(0, 0);
                }
            } else if (lineIndex < textLines.length - 1) {
                // Из текста в аккорды следующей строки
                const nextChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex + 1}"][data-type="chord"]`
                );
                if (nextChordInput) {
                    nextChordInput.focus();
                    nextChordInput.setSelectionRange(0, 0);
                }
            } else {
                // Из последней строки текста в новую строку аккордов
                const newChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-type="new-chord"]`
                );
                if (newChordInput) {
                    newChordInput.focus();
                    newChordInput.setSelectionRange(0, 0);
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const cursorPosition = e.currentTarget.selectionStart || 0;

            if (isChordInput && lineIndex > 0) {
                // Переход из аккордов текущей строки в текст предыдущей строки
                const prevTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex - 1}"][data-type="text"]`
                );
                if (prevTextInput) {
                    prevTextInput.focus();
                    prevTextInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            } else if (!isChordInput) {
                // Переход из текста текущей строки в аккорды текущей строки
                const currentChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex}"][data-type="chord"]`
                );
                if (currentChordInput) {
                    currentChordInput.focus();
                    currentChordInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const cursorPosition = e.currentTarget.selectionStart || 0;

            if (isChordInput) {
                // Переход из аккордов в текст той же строки
                const currentTextInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex}"][data-type="text"]`
                );
                if (currentTextInput) {
                    currentTextInput.focus();
                    currentTextInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            } else if (lineIndex < textLines.length - 1) {
                // Переход из текста в аккорды следующей строки
                const nextChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-line="${lineIndex + 1}"][data-type="chord"]`
                );
                if (nextChordInput) {
                    nextChordInput.focus();
                    nextChordInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            } else if (lineIndex === textLines.length - 1) {
                // Переход из последней строки текста в новую строку аккордов
                const newChordInput = document.querySelector<HTMLInputElement>(
                    `input[data-type="new-chord"]`
                );
                if (newChordInput) {
                    newChordInput.focus();
                    newChordInput.setSelectionRange(cursorPosition, cursorPosition);
                }
            }
        }
    };

    const increaseScrollSpeed = () => {
        setScrollSpeed((prev) => Math.min(prev + 1, 10));
    };

    const decreaseScrollSpeed = () => {
        setScrollSpeed((prev) => Math.max(prev - 1, 0));
    };

    const increaseFontSize = () => {
        setFontSize((prev) => Math.min(prev + 1, 5));
    };

    const decreaseFontSize = () => {
        setFontSize((prev) => Math.max(prev - 1, -3));
    };

    const increaseTonality = () => {
        setTonality((prev) => Math.min(prev + 1, 12));
    };

    const decreaseTonality = () => {
        setTonality((prev) => Math.max(prev - 1, -12));
    };

    if (loading && isEdit) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
                <span className="loading loading-spinner loading-lg"></span>
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

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-1 shrink-0">
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
                    </div>
                </div>
            </div>

            {/* Main Content */}
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
                                    onChange={(e) => setArtist(e.target.value)}
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
                                    onChange={(e) => setTitle(e.target.value)}
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
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="необязательно"
                            />
                        </div>
                    </div>

                    {/* Настройки отображения - компактно в одну строку */}
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-sm">
                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Размер шрифта */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1 border border-blue-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Шрифт</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-indigo-100"
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
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-indigo-100"
                                    onClick={increaseFontSize}
                                    disabled={fontSize >= 5}
                                >
                                    +
                                </button>
                            </div>

                            {/* Скорость прокрутки */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg px-2 py-1 border border-emerald-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Скорость</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-emerald-100"
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
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-emerald-100"
                                    onClick={increaseScrollSpeed}
                                    disabled={scrollSpeed >= 10}
                                >
                                    +
                                </button>
                            </div>

                            {/* Тональность */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg px-2 py-1 border border-amber-100 flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Тональность</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-amber-100"
                                    onClick={decreaseTonality}
                                    disabled={tonality <= -12}
                                >
                                    −
                                </button>
                                <span className="text-xs font-bold text-amber-600 w-7 text-center">
                  {tonality > 0 ? `+${tonality}` : tonality}
                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-xs min-h-0 h-6 w-6 p-0 hover:bg-amber-100"
                                    onClick={increaseTonality}
                                    disabled={tonality >= 12}
                                >
                                    +
                                </button>
                            </div>
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
                                    onChange={(e) => setNewLineChords(e.target.value)}
                                    onKeyDown={(e) => handleNewLineKeyDown(e, true)}
                                    data-type="new-chord"
                                    placeholder="новые аккорды..."
                                />
                                <input
                                    type="text"
                                    className="input w-full font-mono text-xs h-8 rounded-none border-x-0 border-t-0 border-b focus:outline-none focus:bg-base-100"
                                    value={newLineText}
                                    onChange={(e) => setNewLineText(e.target.value)}
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
        </div>
    );
};
