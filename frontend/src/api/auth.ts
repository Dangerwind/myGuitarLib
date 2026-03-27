// src/api/auth.ts
import http from './http';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await http.post<AuthResponse>('/auth/login', data);

        // Сохраняем роль для AdminRoute.
        // Токены приходят в HttpOnly cookie (недоступны из JS),
        // но роль нам нужна чтобы показывать/скрывать ссылку на /admin.
        const role = response.data?.data?.role;
        if (role) {
            localStorage.setItem('userRole', role);
        }

        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await http.post<AuthResponse>('/auth/register', data);

        const role = response.data?.data?.role;
        if (role) {
            localStorage.setItem('userRole', role);
        }

        return response.data;
    },

    logout: async (): Promise<void> => {
        await http.post('/auth/logout');
        localStorage.removeItem('userRole');
    },
};
