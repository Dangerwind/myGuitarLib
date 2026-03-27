// src/pages/admin/AdminUsersPage.tsx
import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, AdminUserDto, PageDto } from '../../api/admin';
import { authApi } from '../../api/auth';

// ── Модальное окно добавления пользователя ───────────────────────────────────

const AddUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [email, setEmail]       = useState('');
    const [name, setName]         = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const resetErrors = () => { setError(''); setPasswordError(''); };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        resetErrors();

        if (password.length < 6) {
            setPasswordError('Пароль должен быть не короче 6 символов.');
            return;
        }
        if (password !== password2) {
            setPasswordError('Пароли не совпадают.');
            return;
        }

        setLoading(true);
        try {
            await authApi.register({ email, name, password });
            onSuccess();
            onClose();
        } catch {
            setError('Не удалось создать пользователя. Возможно, email уже занят.');
        } finally {
            setLoading(false);
        }
    };

    const hasAnyError = Boolean(error || passwordError);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-900">Добавить пользователя</h2>
                    <button
                        className="btn btn-ghost btn-sm h-8 min-h-0 px-2 text-slate-400 hover:text-slate-600"
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                        <input
                            type="email"
                            className="input input-bordered w-full h-9 text-sm"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); resetErrors(); }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Имя</label>
                        <input
                            type="text"
                            className="input input-bordered w-full h-9 text-sm"
                            placeholder="Как обращаться"
                            value={name}
                            onChange={e => { setName(e.target.value); resetErrors(); }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Пароль</label>
                            <input
                                type="password"
                                className="input input-bordered w-full h-9 text-sm"
                                placeholder="Мин. 6 символов"
                                value={password}
                                onChange={e => { setPassword(e.target.value); resetErrors(); }}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Повторите</label>
                            <input
                                type="password"
                                className="input input-bordered w-full h-9 text-sm"
                                placeholder="Ещё раз"
                                value={password2}
                                onChange={e => { setPassword2(e.target.value); resetErrors(); }}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="h-8 flex items-center">
                        {hasAnyError && (
                            <div className="text-xs text-red-600 flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span>{passwordError || error}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm h-9 min-h-0 flex-1 text-xs"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm h-9 min-h-0 flex-1 text-xs"
                            disabled={loading}
                        >
                            {loading
                                ? <span className="loading loading-spinner loading-xs" />
                                : 'Создать аккаунт'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Основная страница ─────────────────────────────────────────────────────────

export const AdminUsersPage = () => {
    const [page, setPage] = useState<PageDto<AdminUserDto> | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const load = (p = 0) => {
        setLoading(true);
        adminApi.getUsers(p, 20, 'id', 'desc')
            .then((data) => { setPage(data); setCurrentPage(p); })
            .catch(() => setError('Не удалось загрузить пользователей'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (user: AdminUserDto) => {
        if (!confirm(`Удалить пользователя ${user.email}? Это действие необратимо.`)) return;
        setDeletingId(user.id);
        try {
            await adminApi.deleteUser(user.id);
            load(currentPage);
        } catch {
            alert('Не удалось удалить пользователя');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>
                <div className="flex items-center gap-3">
                    {page && (
                        <span className="text-sm text-slate-500">
                            Всего: {page.totalItems.toLocaleString()}
                        </span>
                    )}
                    <button
                        className="btn btn-primary btn-sm h-8 min-h-0 text-xs px-3"
                        onClick={() => setShowAddModal(true)}
                    >
                        + Добавить пользователя
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-error"><span>{error}</span></div>}

            <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/60">
                            <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">ID</th>
                            <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Email</th>
                            <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Имя</th>
                            <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Роль</th>
                            <th className="text-left px-4 py-2.5 font-medium text-slate-600 text-xs">Зарегистрирован</th>
                            <th className="px-4 py-2.5"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {(page?.items ?? []).map((user) => (
                            <tr
                                key={user.id}
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                            >
                                <td className="px-4 py-2.5 text-slate-400 text-xs">{user.id}</td>
                                <td className="px-4 py-2.5">
                                    <Link
                                        to={`/admin/users/${user.id}`}
                                        className="text-sky-700 hover:text-sky-900 font-medium hover:underline"
                                    >
                                        {user.email}
                                    </Link>
                                </td>
                                <td className="px-4 py-2.5 text-slate-700">{user.name || '—'}</td>
                                <td className="px-4 py-2.5">
                                        <span className={`badge badge-sm ${
                                            user.role === 'ADMIN'
                                                ? 'badge-error'
                                                : 'badge-ghost'
                                        }`}>
                                            {user.role ?? 'USER'}
                                        </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 text-xs">
                                    {user.createdAt ? formatDate(user.createdAt) : '—'}
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Link
                                            to={`/admin/users/${user.id}`}
                                            className="btn btn-ghost btn-xs h-6 min-h-0 px-2 text-xs"
                                        >
                                            Подробнее
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            disabled={deletingId === user.id}
                                            className="btn btn-ghost btn-xs h-6 min-h-0 px-2 text-xs text-red-500 hover:bg-red-50"
                                        >
                                            {deletingId === user.id ? '...' : 'Удалить'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {page?.items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                                    Пользователи не найдены
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Пагинация */}
            {page && page.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1">
                    <button
                        className="btn btn-ghost btn-xs"
                        disabled={page.isFirst}
                        onClick={() => load(currentPage - 1)}
                    >
                        ←
                    </button>
                    {Array.from({ length: Math.min(page.totalPages, 7) }, (_, i) => {
                        const pageNum = Math.max(0, Math.min(currentPage - 3, page.totalPages - 7)) + i;
                        return (
                            <button
                                key={pageNum}
                                className={`btn btn-xs ${pageNum === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => load(pageNum)}
                            >
                                {pageNum + 1}
                            </button>
                        );
                    })}
                    <button
                        className="btn btn-ghost btn-xs"
                        disabled={page.isLast}
                        onClick={() => load(currentPage + 1)}
                    >
                        →
                    </button>
                </div>
            )}

            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => load(0)}
                />
            )}
        </div>
    );
};
