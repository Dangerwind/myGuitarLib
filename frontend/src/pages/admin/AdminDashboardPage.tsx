// src/pages/admin/AdminDashboardPage.tsx
import { useEffect, useState } from 'react';
import { adminApi, DashboardStats } from '../../api/admin';

const StatCard = ({ label, value, sub }: { label: string; value: number | string; sub?: string }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
);

const EVENT_LABELS: Record<string, string> = {
    SONG_VIEW: 'Просмотр песни',
    SONG_EDIT: 'Редактирование',
    SONG_CREATE: 'Создание песни',
    SONG_DELETE: 'Удаление песни',
    SONG_IMPORT: 'Импорт песни',
    SONG_TONALITY_CHANGE: 'Смена тональности',
    SONG_SEARCH: 'Поиск',
    USER_LOGIN: 'Вход',
    USER_LOGOUT: 'Выход',
    USER_REGISTRATION: 'Регистрация',
    PAGE_VIEW: 'Просмотр страницы',
};

export const AdminDashboardPage = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        adminApi.getDashboard()
            .then(setStats)
            .catch(() => setError('Не удалось загрузить данные'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    );

    if (error) return (
        <div className="alert alert-error"><span>{error}</span></div>
    );

    if (!stats) return null;

    const maxEventCount = Math.max(...(stats.topEventTypes?.map(e => e.count) ?? [1]), 1);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>

            {/* Активные пользователи */}
            <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Активные пользователи
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="DAU (24ч)" value={stats.dau} sub="уникальных" />
                    <StatCard label="WAU (7 дней)" value={stats.wau} sub="уникальных" />
                    <StatCard label="MAU (30 дней)" value={stats.mau} sub="уникальных" />
                </div>
            </div>

            {/* Общая статистика */}
            <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Всего в системе
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Пользователей" value={stats.totalUsers} />
                    <StatCard label="Песен" value={stats.totalSongs} />
                    <StatCard label="Событий" value={stats.totalEvents} />
                </div>
            </div>

            {/* События за периоды */}
            <div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Событий за период
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Сегодня" value={stats.eventsToday} />
                    <StatCard label="За 7 дней" value={stats.eventsWeek} />
                    <StatCard label="За 30 дней" value={stats.eventsMonth} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Топ событий */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Топ событий (30 дней)</h2>
                    <div className="space-y-2">
                        {(stats.topEventTypes ?? []).slice(0, 7).map((item) => (
                            <div key={item.type}>
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs text-slate-600">
                                        {EVENT_LABELS[item.type] ?? item.type}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-800">
                                        {item.count.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-400 rounded-full transition-all"
                                        style={{ width: `${(item.count / maxEventCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {(!stats.topEventTypes || stats.topEventTypes.length === 0) && (
                            <p className="text-xs text-slate-400">Нет данных</p>
                        )}
                    </div>
                </div>

                {/* Топ пользователей */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Топ активных пользователей</h2>
                    <div className="space-y-1.5">
                        {(stats.topActiveUsers ?? []).slice(0, 8).map((user, i) => (
                            <div key={user.userId} className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                                <span className="text-xs text-slate-700 flex-1 truncate">{user.email}</span>
                                <span className="text-xs font-semibold text-slate-800 shrink-0">
                                    {user.count}
                                </span>
                            </div>
                        ))}
                        {(!stats.topActiveUsers || stats.topActiveUsers.length === 0) && (
                            <p className="text-xs text-slate-400">Нет данных</p>
                        )}
                    </div>
                </div>

                {/* Устройства */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Устройства</h2>
                    <div className="space-y-2">
                        {(stats.deviceDistribution ?? []).map((item) => {
                            const max = Math.max(...stats.deviceDistribution.map(d => d.count), 1);
                            return (
                                <div key={item.deviceType}>
                                    <div className="flex justify-between mb-0.5">
                                        <span className="text-xs text-slate-600 capitalize">
                                            {item.deviceType ?? 'unknown'}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800">
                                            {item.count.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-pink-400 rounded-full"
                                            style={{ width: `${(item.count / max) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats.deviceDistribution || stats.deviceDistribution.length === 0) && (
                            <p className="text-xs text-slate-400">Нет данных</p>
                        )}
                    </div>
                </div>

                {/* Браузеры */}
                <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-700 mb-3">Браузеры</h2>
                    <div className="space-y-2">
                        {(stats.browserDistribution ?? []).map((item) => {
                            const max = Math.max(...stats.browserDistribution.map(d => d.count), 1);
                            return (
                                <div key={item.browser}>
                                    <div className="flex justify-between mb-0.5">
                                        <span className="text-xs text-slate-600">
                                            {item.browser ?? 'unknown'}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800">
                                            {item.count.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-400 rounded-full"
                                            style={{ width: `${(item.count / max) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats.browserDistribution || stats.browserDistribution.length === 0) && (
                            <p className="text-xs text-slate-400">Нет данных</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
