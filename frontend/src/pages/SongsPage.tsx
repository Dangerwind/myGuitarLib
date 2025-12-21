// src/pages/SongsPage.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { songsApi, ArtistTitleDto } from '../api/songs';
import { authApi } from '../api/auth';

export const SongsPage = () => {
    const [songs, setSongs] = useState<ArtistTitleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'artist' | 'title'>('artist');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const navigate = useNavigate();

    const loadSongs = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await songsApi.getAll(searchQuery, sortBy, sortDir);
            setSongs(data);
        } catch (err) {
            console.error('Failed to load songs:', err);
            setError('Не удалось загрузить песни');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSongs();
    }, [searchQuery, sortBy, sortDir]);

    useEffect(() => {
        const handleLogout = () => {
            navigate('/login', { replace: true });
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            navigate('/login');
        } catch {
            navigate('/login');
        }
    };

    const toggleSortDir = () => {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const handleSearch = () => {
        setSearchQuery(searchInput.trim());
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    if (loading && songs.length === 0) {
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
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-9 h-9 rounded-xl border-2 border-slate-800 flex items-center justify-center">
                            <span className="text-lg">🎸</span>
                        </div>
                        <div className="text-sm md:text-base font-semibold text-slate-900 whitespace-nowrap">
                            Хранитель песен
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            onClick={() => alert('Поделиться — в разработке')}
                            title="Поделиться песнями"
                        >
                            📤 Поделиться
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            onClick={() => alert('Поделиться — в разработке')}
                            title="Поделиться песнями"
                        >
                            📤
                        </button>

                        <Link
                            to="/songs/new"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs hidden xl:flex"
                            title="Добавить новую песню"
                        >
                            ➕ Добавить песню
                        </Link>
                        <Link
                            to="/songs/new"
                            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs xl:hidden"
                            title="Добавить новую песню"
                        >
                            ➕
                        </Link>

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

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-4">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">
                    Мои песни
                </h1>

                {/* Поиск и сортировка */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 mb-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Поиск */}
                        <div className="flex gap-2 flex-1">
                            <input
                                type="text"
                                placeholder="Поиск по названию или автору..."
                                className="input input-bordered input-sm w-full h-8 text-sm"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm h-8 min-h-0 px-3"
                                onClick={handleSearch}
                                title="Искать"
                            >
                                🔍
                            </button>
                        </div>

                        {/* Сортировка */}
                        <div className="flex gap-2 items-center">
                            <select
                                className="select select-bordered select-sm h-8 min-h-0 text-sm w-full sm:w-auto"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'artist' | 'title')}
                            >
                                <option value="artist">По автору</option>
                                <option value="title">По названию</option>
                            </select>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm h-8 min-h-0 w-8 p-0"
                                onClick={toggleSortDir}
                                title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}
                            >
                                {sortDir === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Список песен */}
                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : songs.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                        <p className="text-slate-600 mb-4">
                            {searchQuery
                                ? 'Песни не найдены. Попробуй другой запрос.'
                                : 'Пока нет песен. Добавь свою первую!'}
                        </p>
                        {!searchQuery && (
                            <Link to="/songs/new" className="btn btn-primary">
                                ➕ Добавить песню
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {songs.map((song) => (
                            <Link
                                key={song.id}
                                to={`/songs/${song.id}`}
                                className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow group"
                            >
                                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {song.artist}
                  </span>
                                    <span className="text-slate-400">—</span>
                                    <span className="text-base text-slate-700 group-hover:text-blue-500 transition-colors">
                    {song.title}
                  </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
