// src/pages/admin/AdminLayout.tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

const navItems = [
    { to: '/admin', label: 'Дашборд', icon: '📊', end: true },
    { to: '/admin/users', label: 'Пользователи', icon: '👥', end: false },
    { to: '/admin/songs', label: 'Песни', icon: '🎵', end: false },
    { to: '/admin/analytics', label: 'Аналитика', icon: '📈', end: false },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } finally {
            localStorage.removeItem('userRole');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-pink-100 flex">
            {/* Сайдбар */}
            <aside className="w-56 shrink-0 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col sticky top-0 h-screen shadow-sm">
                {/* Лого */}
                <div className="px-4 py-4 border-b border-slate-200 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl border-2 border-slate-800 flex items-center justify-center">
                        <span className="text-base">🎸</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">MyGuitarLib</div>
                        <div className="text-xs text-slate-400">Admin Panel</div>
                    </div>
                </div>

                {/* Навигация */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`
                            }
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Нижняя часть */}
                <div className="px-2 py-3 border-t border-slate-200 space-y-0.5">
                    <NavLink
                        to="/songs"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                        <span className="text-base">◀️</span>
                        К сайту
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <span className="text-base">🚪</span>
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Контент */}
            <main className="flex-1 min-w-0 px-6 py-6">
                {children}
            </main>
        </div>
    );
};
