// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SongsPage } from './pages/SongsPage';
import { SongViewPage } from './pages/SongViewPage';
import { SongEditPage } from './pages/SongEditPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Главная страница - редирект на список песен */}
                <Route path="/" element={<Navigate to="/songs" replace />} />

                {/* Публичные маршруты */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Защищённые маршруты */}
                <Route
                    path="/songs"
                    element={
                        <ProtectedRoute>
                            <SongsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/songs/:id"
                    element={
                        <ProtectedRoute>
                            <SongViewPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/songs/:id/edit"
                    element={
                        <ProtectedRoute>
                            <SongEditPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/songs/new"
                    element={
                        <ProtectedRoute>
                            <SongEditPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
