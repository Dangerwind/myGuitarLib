// src/pages/ResetPasswordPage.tsx
import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Ссылка недействительна. Запроси новую.');
        }
    }, [token]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Пароль должен быть не короче 6 символов.');
            return;
        }
        if (password !== password2) {
            setError('Пароли не совпадают.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.message || 'Ссылка недействительна или истекла.');
            }
        } catch {
            setError('Что-то пошло не так. Попробуй позже.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <span className="loading loading-spinner loading-lg text-sky-600"></span>
                </div>
            )}

            <div className="w-full max-w-md mx-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl border-2 border-slate-800 flex items-center justify-center">
                        <span className="text-xl">🎸</span>
                    </div>
                    <span className="text-xl font-semibold text-slate-900">Хранитель песен</span>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Пароль изменён!</h2>
                        <p className="text-slate-600 text-sm mb-6">
                            Через несколько секунд ты будешь перенаправлен на страницу входа.
                        </p>
                        <Link to="/login" className="btn btn-primary w-full">Войти</Link>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Новый пароль</h2>
                        <p className="text-slate-500 text-sm mb-6">Придумай новый пароль для своего аккаунта.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Новый пароль</label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full h-10 text-sm"
                                    placeholder="Минимум 6 символов"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={!token}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Повтори пароль</label>
                                <input
                                    type="password"
                                    className="input input-bordered w-full h-10 text-sm"
                                    placeholder="Ещё раз пароль"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    required
                                    disabled={!token}
                                />
                            </div>

                            {error && (
                                <div className="text-xs text-red-600 flex items-center gap-2">
                                    <span>⚠️</span><span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary w-full h-10 min-h-0 text-sm"
                                disabled={loading || !token}
                            >
                                Сохранить пароль
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
