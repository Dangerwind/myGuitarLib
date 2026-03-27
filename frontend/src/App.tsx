// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SongsPage } from './pages/SongsPage';
import { SongViewPage } from './pages/SongViewPage';
import { SongEditPage } from './pages/SongEditPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminSongsPage } from './pages/admin/AdminSongsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { SharedSongPage } from './pages/SharedSongPage';
import { LandingPage } from './pages/LandingPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Публичные */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Пользовательские */}
                <Route path="/songs" element={<ProtectedRoute><SongsPage /></ProtectedRoute>} />
                <Route path="/songs/:id" element={<ProtectedRoute><SongViewPage /></ProtectedRoute>} />
                <Route path="/songs/:id/edit" element={<ProtectedRoute><SongEditPage /></ProtectedRoute>} />
                <Route path="/songs/new" element={<ProtectedRoute><SongEditPage /></ProtectedRoute>} />

                {/* Админ-панель */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminDashboardPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminUsersPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users/:id"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminUserDetailPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/songs"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminSongsPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/analytics"
                    element={
                        <AdminRoute>
                            <AdminLayout>
                                <AdminAnalyticsPage />
                            </AdminLayout>
                        </AdminRoute>
                    }
                />
                {/* Публичная страница по ссылке */}
                <Route path="/shared" element={<SharedSongPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;