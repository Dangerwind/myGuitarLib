// src/pages/ForgotPasswordPage.tsx
import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPasswordPage = () => {
    const [login, setLogin] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await fetch('/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: login }),
            });
            // Всегда показываем успех — даже если логин не найден
            setSent(true);
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

                {sent ? (
                    // Успешное состояние
                    <div className="text-center">
                        <div className="text-5xl mb-4">📬</div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Инструкция отправлена</h2>
                        <p className="text-slate-600 text-sm mb-6">
                            Если аккаунт с логином <strong>{login}</strong> существует —
                            ты получишь инструкцию по восстановлению пароля.
                        </p>
                        <Link to="/login" className="btn btn-primary w-full">
                            Вернуться ко входу
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Забыли пароль?</h2>
                        <p className="text-slate-500 text-sm mb-6">
                            Введи свой логин — я пришлю тебе инструкцию как восстановить пароль.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Логин</label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full h-10 text-sm"
                                    placeholder="Введите логин"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    required
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
                                disabled={loading}
                            >
                                Отправить инструкцию
                            </button>
                        </form>

                        <div className="mt-4 text-center text-xs text-slate-500">
                            <Link to="/login" className="text-sky-700 hover:text-sky-800 font-medium">
                                ← Вернуться ко входу
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};