// src/pages/LandingPage.tsx
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/** Отдельный axios без 401-перехватчика — не триггерит редирект на /login */
const authCheck = axios.create({ baseURL: '/api/v1', withCredentials: true });

export const LandingPage = () => {
    const navigate = useNavigate();

    // Показываем лендинг сразу. Параллельно тихо проверяем сессию.
    // Если залогинен — уходим на /songs. Если нет — остаёмся на лендинге.
    useEffect(() => {
        authCheck.get('/auth/me')
            .then((res) => {
                if (res.data?.success === true) {
                    navigate('/songs', { replace: true });
                }
            })
            .catch(() => {});
    }, [navigate]);


    return (
        <div style={{ fontFamily: "'Geologica', 'Inter', sans-serif", background: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>

            {/* ── ШАПКА ───────────────────────────────────────────── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(148,163,184,0.2)',
                padding: '0 24px',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                        <div style={{
                            width: 34, height: 34, border: '2px solid #1e293b', borderRadius: 9,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                        }}>🎸</div>
                        Хранитель песен
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link to="/login" style={{
                            padding: '7px 18px', borderRadius: 8,
                            fontSize: 13, fontWeight: 600, color: '#475569',
                            textDecoration: 'none', border: '1px solid #e2e8f0',
                            background: 'white',
                        }}>Войти</Link>
                        <Link to="/register" style={{
                            padding: '7px 18px', borderRadius: 8,
                            fontSize: 13, fontWeight: 700, color: 'white',
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                        }}>Зарегистрироваться</Link>
                    </div>
                </div>
            </header>

            {/* ── ГЕРОЙ ───────────────────────────────────────────── */}
            <section style={{
                background: 'linear-gradient(160deg, #e0f2fe 0%, #f8fafc 45%, #ede9fe 100%)',
                padding: '88px 24px 72px',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 700, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                        fontSize: 12, fontWeight: 600,
                        padding: '5px 14px', borderRadius: 20, marginBottom: 28,
                        border: '1px solid rgba(99,102,241,0.2)',
                    }}>
                        🎸 Бесплатно · Для всех
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(34px, 6vw, 58px)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        letterSpacing: '-1px',
                        color: '#1e293b',
                        marginBottom: 20,
                    }}>
                        Все твои песни<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>в одном месте</span>
                    </h1>

                    <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.75, marginBottom: 36, fontWeight: 300 }}>
                        Собери свой репертуар, расставь аккорды и играй в удобном темпе.<br />
                        Автопрокрутка освободит руки.
                    </p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" style={{
                            padding: '14px 32px', borderRadius: 12,
                            fontSize: 15, fontWeight: 700, color: 'white',
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                            transition: 'transform .15s',
                        }}>
                            Начать бесплатно →
                        </Link>
                        <Link to="/login" style={{
                            padding: '14px 32px', borderRadius: 12,
                            fontSize: 15, fontWeight: 600, color: '#475569',
                            textDecoration: 'none',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                        }}>
                            Уже есть аккаунт
                        </Link>
                    </div>

                    <p style={{ marginTop: 18, fontSize: 12, color: '#94a3b8' }}>
                        Регистрация за 30 секунд · Без карты · Без рекламы
                    </p>
                </div>

                {/* ── Макет приложения ── */}
                <div style={{ maxWidth: 820, margin: '56px auto 0', position: 'relative' }}>
                    {/* Тень под макетом */}
                    <div style={{
                        position: 'absolute', bottom: -24, left: '10%', right: '10%',
                        height: 40, background: 'rgba(99,102,241,0.15)',
                        filter: 'blur(24px)', borderRadius: '50%',
                    }} />

                    {/* Браузер-рамка */}
                    <div style={{
                        background: 'white',
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.3)',
                        boxShadow: '0 24px 60px rgba(15,23,42,0.12)',
                        overflow: 'hidden',
                    }}>
                        {/* Браузер-хром */}
                        <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                                {['#fc6058','#fec02f','#2aca44'].map(c => (
                                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                ))}
                            </div>
                            <div style={{ flex: 1, background: 'white', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                                🔒 myguitarlib.ru/songs
                            </div>
                        </div>

                        {/* Шапка приложения */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            padding: '10px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontWeight: 700, fontSize: 13 }}>
                                <div style={{ width: 26, height: 26, border: '2px solid rgba(255,255,255,0.6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎸</div>
                                Хранитель песен
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['📤 Поделиться', '✏️ Редактировать', '← Назад'].map(t => (
                                    <div key={t} style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{t}</div>
                                ))}
                            </div>
                        </div>

                        {/* Контент — просмотр песни */}
                        <div style={{ padding: '20px 28px', background: 'white', textAlign: 'left' }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Группа крови</div>
                                <div style={{ fontSize: 13, color: '#64748b' }}>Виктор Цой</div>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 2, textAlign: 'left' }}>
                                {[
                                    { chords: 'Am        ', lyrics: 'Группа крови — на рукаве,' },
                                    { chords: '           Em', lyrics: 'Мой порядковый номер — на рукаве.' },
                                    { chords: '', lyrics: '' },
                                    { chords: 'Dm      G', lyrics: 'Пожелай мне удачи в бою,' },
                                    { chords: '   Am', lyrics: 'Пожелай мне ...' },
                                ].map((line, i) => (
                                    <div key={i}>
                                        {line.chords && <div style={{ color: '#0369a1', fontWeight: 700, whiteSpace: 'pre' }}>{line.chords}</div>}
                                        <div style={{ color: '#1e293b', whiteSpace: 'pre', minHeight: '1.2em' }}>{line.lyrics || ' '}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ФИЧИ ────────────────────────────────────────────── */}
            <section style={{ padding: '88px 24px', background: 'white' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', marginBottom: 12 }}>Всё что нужно для гитарника</h2>
                        <p style={{ fontSize: 16, color: '#64748b', fontWeight: 300 }}>Никаких лишних функций — только то, что нужно на репетиции, гитарнике или выступлении</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

                        {/* Карточка 1 — Список */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '20px 20px 8px', background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
                                {/* Мини-макет списка */}
                                <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <div style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 10, color: '#94a3b8' }}>🔍 Поиск…</div>
                                        <div style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '5px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>По исполнителю ↑</div>
                                    </div>
                                    {[
                                        { a: 'Виктор Цой', t: 'Группа крови' },
                                        { a: 'ДДТ', t: 'Это всё' },
                                        { a: 'Кино', t: 'Последний герой' },
                                    ].map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{s.a}</div>
                                                <div style={{ fontSize: 10, color: '#64748b' }}>{s.t}</div>
                                            </div>
                                            <div style={{ color: '#cbd5e1', fontSize: 14 }}>›</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: '16px 20px 20px' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>📚 Личная библиотека</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 300 }}>Все песни в одном списке. Мгновенный поиск по исполнителю или названию, сортировка в любом направлении.</div>
                            </div>
                        </div>

                        {/* Карточка 2 — Просмотр с управлением */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '20px 20px 8px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' }}>
                                <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                        padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center',
                                    }}>
                                        {[
                                            { label: 'Шрифт', val: '+2', color: 'rgba(255,255,255,0.9)' },
                                            { label: 'Скорость', val: '7', color: '#86efac' },
                                        ].map(c => (
                                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 7, padding: '3px 8px' }}>
                                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{c.label}</span>
                                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', cursor: 'default' }}>−</span>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: c.color, minWidth: 14, textAlign: 'center' }}>{c.val}</span>
                                                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', cursor: 'default' }}>+</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.9 }}>
                                        <div style={{ color: '#0369a1', fontWeight: 700 }}>Am        G</div>
                                        <div style={{ color: '#1e293b' }}>Пожелай мне удачи</div>
                                        <div style={{ color: '#0369a1', fontWeight: 700 }}>C         F</div>
                                        <div style={{ color: '#1e293b' }}>В этом суровом бою</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '16px 20px 20px' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>📜 Играй свободно</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 300 }}>Автопрокрутка с регулируемой скоростью. Размер шрифта подстраивается под телефон, планшет или ноутбук — и сохраняется. Меняй тональность под свой голос.</div>
                            </div>
                        </div>

                        {/* Карточка 3 — Импорт + Поделиться */}
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                            <div style={{ padding: '20px 20px 8px', background: 'linear-gradient(135deg, #fdf4ff, #fce7f3)' }}>
                                <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                                    {/* Импорт */}
                                    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', marginBottom: 5 }}>📥 Импорт текста</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 9, background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '6px 8px', color: '#64748b', lineHeight: 1.8 }}>
                                            <span style={{ color: '#0369a1', fontWeight: 700 }}>Am  G</span><br />
                                            Группа крови на рукаве<br />
                                            <span style={{ color: '#0369a1', fontWeight: 700 }}>C   F</span><br />
                                            Мой порядковый номер…
                                        </div>
                                    </div>
                                    {/* Поделиться */}
                                    <div style={{ padding: '10px 12px' }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#6366f1', marginBottom: 5 }}>🔗 Поделиться</div>
                                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontFamily: 'monospace', fontSize: 9, color: '#6366f1', marginBottom: 6 }}>
                                            myguitarlib.ru/shared?t=xK9…
                                        </div>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <div style={{ background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>📋 Копировать</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '16px 20px 20px' }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>📥 Импорт и шеринг</div>
                                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, fontWeight: 300 }}>Вставь текст с аккордами из любого источника — сайт разберёт сам. Поделись ссылкой с другом: он увидит песню без регистрации.</div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── КАК ЭТО РАБОТАЕТ ────────────────────────────────── */}
            <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #f8fafc, #eef2ff)' }}>
                <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', marginBottom: 12 }}>Три шага до первой песни</h2>
                    <p style={{ fontSize: 15, color: '#64748b', fontWeight: 300, marginBottom: 48 }}>Без лишних настроек</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {[
                            { num: '1', icon: '👤', title: 'Создай аккаунт', desc: 'Только логин и пароль. Никаких подтверждений и лишних шагов.' },
                            { num: '2', icon: '🎵', title: 'Добавь песню', desc: 'Введи вручную, импортируй из интернета или скопируй у друга по ссылке.' },
                            { num: '3', icon: '🎸', title: 'Играй', desc: 'Открой на любом устройстве, включи автопрокрутку — обе руки на гитаре.' },
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', textAlign: 'left', paddingBottom: i < 2 ? 36 : 0, position: 'relative' }}>
                                {i < 2 && (
                                    <div style={{ position: 'absolute', left: 21, top: 48, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #c7d2fe, transparent)' }} />
                                )}
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 20, boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                    position: 'relative',
                                }}>
                                    {step.icon}
                                </div>
                                <div style={{ paddingTop: 6 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{step.title}</div>
                                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, fontWeight: 300 }}>{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <section style={{
                padding: '80px 24px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                textAlign: 'center',
            }}>
                <div style={{ maxWidth: 560, margin: '0 auto' }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🎸</div>
                    <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 14 }}>
                        Начни собирать репертуар
                    </h2>
                    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, lineHeight: 1.7, fontWeight: 300 }}>
                        Бесплатно, без ограничений на количество песен,<br />
                        на любом устройстве.
                    </p>
                    <Link to="/register" style={{
                        display: 'inline-block',
                        padding: '16px 40px', borderRadius: 12,
                        fontSize: 16, fontWeight: 700, color: '#6366f1',
                        textDecoration: 'none',
                        background: 'white',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}>
                        Создать аккаунт бесплатно →
                    </Link>
                    <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                        Уже есть аккаунт? <Link to="/login" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textDecoration: 'underline' }}>Войти</Link>
                    </p>
                </div>
            </section>

            {/* ── ПОДВАЛ ──────────────────────────────────────────── */}
            <footer style={{ background: '#1e293b', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.4)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎸</div>
                    Хранитель песен
                </div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Твоя личная библиотека с аккордами</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>
                    Вопросы и предложения:{' '}
                    <a href="mailto:contact@myguitarlib.ru" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>
                        contact@myguitarlib.ru
                    </a>
                </p>
            </footer>

        </div>
    );
};