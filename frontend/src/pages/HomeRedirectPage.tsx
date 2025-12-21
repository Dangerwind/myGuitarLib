// src/pages/HomeRedirectPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const HomeRedirectPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/login', { replace: true });
    }, [navigate]);

    return null;
};
