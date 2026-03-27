// src/pages/LoginPage.tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export const LoginPage = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const resetErrors = () => { setError(''); };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        resetErrors();
        setLoading(true);
        try {
            await authApi.login({ email: login, password });
            navigate('/songs');
        } catch {
            setError('Неверный логин или пароль. Проверь данные и попробуй снова.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
            {/* Оверлей загрузки */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                    <span className="loading loading-spinner loading-lg text-sky-600"></span>
                </div>
            )}

            <div className="max-w-6xl w-full mx-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-hidden">
                {/* Левая часть */}
                <div className="w-full md:w-1/2 px-8 md:px-10 py-8 md:py-12 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl border-2 border-slate-800 flex items-center justify-center">
                                <span className="text-xl">🎸</span>
                            </div>
                            <span className="text-xl font-semibold text-slate-900">
                                Хранитель песен
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold leading-snug text-slate-900 mb-4">
                            Аккорды
                            <br />
                            всегда под
                            <br />
                            рукой
                        </h1>

                        <p className="text-slate-600 text-sm md:text-base max-w-md">
                            Твой личный хранитель песен. Аккорды всегда под рукой для игры и вокала.
                        </p>
                    </div>
                </div>

                {/* Правая часть */}
                <div className="w-full md:w-1/2 px-6 md:px-8 py-8 md:py-12 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">
                            Вход
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Логин</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input input-bordered w-full h-10 text-sm pr-9"
                                        placeholder="Введите логин"
                                        value={login}
                                        onChange={(e) => { setLogin(e.target.value); resetErrors(); }}
                                        required
                                    />
                                    <span className="absolute inset-y-0 right-2 flex items-center text-slate-400 text-sm">👤</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Пароль</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className="input input-bordered w-full h-10 text-sm pr-8"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); resetErrors(); }}
                                        required
                                    />
                                    <span className="absolute inset-y-0 right-2 flex items-center text-slate-400 text-sm">🔒</span>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-sky-600 hover:text-sky-700"
                                    >
                                        Забыли пароль?
                                    </Link>
                                </div>
                            </div>

                            {/* Зона ошибок */}
                            <div className="h-10 flex items-center">
                                {error && (
                                    <div className="text-xs text-red-600 flex items-center gap-2">
                                        <span className="text-base leading-none">⚠️</span>
                                        <div>{error}</div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full h-10 min-h-0 text-sm"
                                disabled={loading}
                            >
                                Войти
                            </button>
                        </form>

                        <div className="mt-4 text-center text-xs text-slate-700">
                            Нет аккаунта?{' '}
                            <Link to="/register" className="font-semibold text-sky-700 hover:text-sky-800">
                                Регистрация
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};