// src/pages/admin/AdminAnalyticsPage.tsx
import { useEffect, useState } from 'react';
import { adminApi, AdminAnalyticsEvent, PageDto } from '../../api/admin';

const EVENT_TYPES = [
    'USER_REGISTRATION', 'USER_LOGIN', 'USER_LOGOUT',
    'SONG_VIEW', 'SONG_EDIT', 'SONG_CREATE', 'SONG_IMPORT',
    'SONG_DELETE', 'SONG_TONALITY_CHANGE', 'SONG_SEARCH', 'PAGE_VIEW', 'SONG_SHARED_VIEW',
];

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

export const AdminAnalyticsPage = () => {
    const [data, setData]               = useState<PageDto<AdminAnalyticsEvent> | null>(null);
    const [page, setPage]               = useState(0);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [deletingId, setDeletingId]   = useState<number | null>(null);

    // Фильтры
    const [filterType, setFilterType]   = useState('');
    const [filterUserId, setFilterUserId] = useState('');
    const [filterSince, setFilterSince] = useState('');

    // Применённые фильтры (применяются по кнопке)
    const [appliedType, setAppliedType]     = useState('');
    const [appliedUserId, setAppliedUserId] = useState('');
    const [appliedSince, setAppliedSince]   = useState('');

    const load = (p: number, type: string, uid: string, since: string) => {
        setLoading(true);
        setError('');
        adminApi.getAnalytics(
            p, 20,
            type || undefined,
            uid ? Number(uid) : undefined,
            since ? since + ':00' : undefined,
        )
            .then(setData)
            .catch(() => setError('Не удалось загрузить аналитику'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(page, appliedType, appliedUserId, appliedSince);
    }, [page, appliedType, appliedUserId, appliedSince]);

    const handleApplyFilters = () => {
        setPage(0);
        setAppliedType(filterType);
        setAppliedUserId(filterUserId);
        setAppliedSince(filterSince);
    };

    const handleResetFilters = () => {
        setFilterType(''); setFilterUserId(''); setFilterSince('');
        setPage(0);
        setAppliedType(''); setAppliedUserId(''); setAppliedSince('');
    };

    const handleDelete = async (event: AdminAnalyticsEvent) => {
        if (!confirm(`Удалить событие #${event.id}?`)) return;
        setDeletingId(event.id);
        try {
            await adminApi.deleteAnalyticsEvent(event.id);
            load(page, appliedType, appliedUserId, appliedSince);
        } catch {
            alert('Не удалось удалить событие');
        } finally {
            setDeletingId(null);
        }
    };

    const hasActiveFilters = appliedType || appliedUserId || appliedSince;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Аналитика</h1>
                {data && (
                    <span className="text-sm text-slate-500">
                        {hasActiveFilters ? `Найдено: ${data.totalItems}` : `Всего: ${data.totalItems.toLocaleString()}`}
                    </span>
                )}
            </div>

            {/* Фильтры */}
            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Тип события</label>
                        <select
                            className="select select-bordered select-sm h-8 min-h-0 w-full text-sm"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="">Все типы</option>
                            {EVENT_TYPES.map(t => (
                                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]} ({t})</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-36">
                        <label className="block text-xs font-medium text-slate-600 mb-1">ID пользователя</label>
                        <input
                            type="number"
                            className="input input-bordered input-sm h-8 w-full text-sm"
                            placeholder="Напр. 5"
                            value={filterUserId}
                            onChange={e => setFilterUserId(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="block text-xs font-medium text-slate-600 mb-1">С даты</label>
                        <input
                            type="datetime-local"
                            className="input input-bordered input-sm h-8 w-full text-sm"
                            value={filterSince}
                            onChange={e => setFilterSince(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            className="btn btn-primary btn-sm h-8 min-h-0 text-xs px-4"
                            onClick={handleApplyFilters}
                        >
                            Применить
                        </button>
                        {hasActiveFilters && (
                            <button
                                className="btn btn-ghost btn-sm h-8 min-h-0 text-xs px-3 text-slate-500"
                                onClick={handleResetFilters}
                            >
                                Сбросить
                            </button>
                        )}
                    </div>
                </div>
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
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">ID</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Тип</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Пользователь</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Устройство</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Браузер</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">IP</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Дата</th>
                                <th className="px-4 py-3 w-12" />
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {data?.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-slate-400">
                                        {hasActiveFilters ? 'Ничего не найдено по фильтрам' : 'Нет событий'}
                                    </td>
                                </tr>
                            )}
                            {data?.items.map(event => (
                                <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{event.id}</td>
                                    <td className="px-4 py-2.5">
                                            <span className="text-slate-700">
                                                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
                                            </span>
                                    </td>
                                    <td className="px-4 py-2.5 hidden sm:table-cell">
                                        {event.userEmail ? (
                                            <a
                                                href={`/admin/users/${event.userId}`}
                                                className="text-blue-600 hover:text-blue-700 text-xs"
                                            >
                                                {event.userEmail}
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 text-xs">аноним</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell">
                                        {event.deviceType || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden lg:table-cell">
                                        {event.browser || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-400 text-xs font-mono hidden xl:table-cell">
                                        {event.ipAddress || '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                                        {fmt(event.createdAt)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            className="btn btn-ghost btn-xs h-6 min-h-0 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(event)}
                                            disabled={deletingId === event.id}
                                        >
                                            {deletingId === event.id
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
        </div>
    );
};