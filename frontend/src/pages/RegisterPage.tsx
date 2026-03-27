// src/pages/RegisterPage.tsx
import { Link } from 'react-router-dom';

export const RegisterPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-pink-100 px-4 py-10">
            <div className="max-w-2xl w-full mx-auto space-y-4">

                {/* Шапка */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200 px-8 py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl border-2 border-slate-800 flex items-center justify-center shrink-0">
                            <span className="text-xl">🎸</span>
                        </div>
                        <span className="text-xl font-semibold text-slate-900">Хранитель песен</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 leading-snug">
                        Личный архив песен<br />
                        <span className="text-sky-600">для себя и друзей</span>
                    </h1>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                        Это мой пет-проект, который я придумал и сделал сам — чтобы хранить любимые
                        песни с аккордами в одном месте. Удобно на гитарнике, репетиции или концерте.
                        Проект закрытый: новые аккаунты создаю только я.
                    </p>
                </div>

                {/* Войти */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 px-8 py-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Войти в приложение</h2>
                    <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium text-slate-800">Друзья</span> — вы знаете свой логин и пароль. Добро пожаловать 🙂
                    </p>
                    <p className="text-sm text-slate-600 mb-4">
                        <span className="font-medium text-slate-800">Хотите посмотреть, как всё работает?</span>{' '}
                        Используйте тестовый аккаунт:
                    </p>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono text-slate-700 space-y-1 mb-5">
                        <div><span className="text-slate-400 select-none">логин:  </span>test</div>
                        <div><span className="text-slate-400 select-none">пароль: </span>12345678</div>
                    </div>
                    <Link
                        to="/login"
                        className="btn btn-primary w-full h-10 min-h-0 text-sm"
                    >
                        Перейти к входу →
                    </Link>
                </div>

                {/* О разработчике */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 px-8 py-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">О разработчике</h2>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        Я Java-разработчик, и этот проект — часть моего портфолио.
                        Создан с нуля: бэкенд, фронтенд, деплой. Если хотите поговорить о сотрудничестве — пишите.
                    </p>
                    <p className="text-sm text-slate-600 mb-1">
                        📧{' '}
                        <a href="mailto:admin@myguitarlib.ru" className="text-sky-700 hover:text-sky-900 font-medium hover:underline">
                            admin@myguitarlib.ru
                        </a>
                    </p>
                    <p className="text-sm text-slate-600">
                        ✈️{' '}
                        <a href="https://t.me/that_is_myname" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:text-sky-900 font-medium hover:underline">
                            @that_is_myname
                        </a>
                    </p>
                </div>

            </div>
        </div>
    );
};