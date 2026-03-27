// src/components/ProtectedRoute.tsx
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    // Полагаемся на http interceptor из http.ts
    // Он автоматически перенаправит на login при 401
    return <>{children}</>;
};
