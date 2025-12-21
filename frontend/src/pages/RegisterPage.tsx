// src/pages/RegisterPage.tsx
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const resetErrors = () => {
        setError('');
        setPasswordError('');
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        resetErrors();

        if (password.length < 6) {
            setPasswordError('Пароль должен быть не короче 6 символов.');
            return;
        }

        if (password !== password2) {
            setPasswordError('Пароли не совпадают. Проверь ввод.');
            return;
        }

        setLoading(true);

        try {
            await authApi.register({ email, username, password });
            navigate('/songs');
        } catch {
            setError('Не удалось создать аккаунт. Проверь email и попробуй ещё раз.');
        } finally {
            setLoading(false);
        }
    };

    const hasAnyError = Boolean(error || passwordError);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100">
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
                            Создай личный
                            <br />
                            архив песен
                        </h1>

                        <p className="text-slate-600 text-sm md:text-base max-w-md">
                            Сохраняй любимые песни с аккордами. Твои любимые песни всегда под рукой:
                            на гитарнике, репетиции и концерте.
                        </p>
                    </div>
                </div>

                {/* Правая часть — компактная форма регистрации */}
                <div className="w-full md:w-1/2 px-6 md:px-8 py-8 md:py-12 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-4">
                            Регистрация
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        className="input input-bordered w-full h-10 text-sm pr-9"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            resetErrors();
                                        }}
                                        required
                                    />
                                    <span className="absolute inset-y-0 right-2 flex items-center text-slate-400 text-sm">
                    ✉️
                  </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full h-10 text-sm"
                                    placeholder="Как к тебе обращаться"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        resetErrors();
                                    }}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Пароль
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            className="input input-bordered w-full h-10 text-sm pr-8"
                                            placeholder="Минимум 6 символов"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                resetErrors();
                                            }}
                                            required
                                        />
                                        <span className="absolute inset-y-0 right-2 flex items-center text-slate-400 text-sm">
                      🔒
                    </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Повторите пароль
                                    </label>
                                    <input
                                        type="password"
                                        className="input input-bordered w-full h-10 text-sm"
                                        placeholder="Ещё раз пароль"
                                        value={password2}
                                        onChange={(e) => {
                                            setPassword2(e.target.value);
                                            resetErrors();
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* фиксированная зона ошибок */}
                            <div className="h-10 flex items-center">
                                {hasAnyError && (
                                    <div className="text-xs text-red-600 flex items-center gap-2">
                                        <span className="text-base leading-none">⚠️</span>
                                        <div>
                                            {passwordError && <div>{passwordError}</div>}
                                            {error && !passwordError && <div>{error}</div>}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary w-full h-10 min-h-0 text-sm ${
                                    loading ? 'loading' : ''
                                }`}
                                disabled={loading}
                            >
                                Создать аккаунт
                            </button>
                        </form>

                        <div className="mt-4 text-center text-xs text-slate-700">
                            Уже есть аккаунт?{' '}
                            <Link
                                to="/login"
                                className="font-semibold text-sky-700 hover:text-sky-800"
                            >
                                Войти
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
