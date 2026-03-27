// src/components/AdminRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
    children: ReactNode;
}

/**
 * Защита маршрутов /admin/*.
 * Роль сохраняется в localStorage ключом 'userRole' при логине.
 * Если роль не ADMIN — редиректит на /songs.
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
    const role = localStorage.getItem('userRole');

    if (role !== 'ADMIN') {
        return <Navigate to="/songs" replace />;
    }

    return <>{children}</>;
};
