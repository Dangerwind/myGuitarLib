// src/hooks/useWakeLock.ts
import { useEffect, useRef } from 'react';
import NoSleep from 'nosleep.js';

/**
 * Предотвращает блокировку экрана на всех устройствах включая iOS/iPadOS.
 * Использует проверенную библиотеку NoSleep.js.
 */
export const useWakeLock = () => {
    const noSleepRef = useRef<NoSleep | null>(null);

    useEffect(() => {
        // Создаём NoSleep instance
        noSleepRef.current = new NoSleep();

        // Функция активации (нужен user gesture на iOS)
        const enable = () => {
            if (noSleepRef.current && !noSleepRef.current.isEnabled) {
                noSleepRef.current.enable();
                console.log('✓ NoSleep активирован');

                // Убираем обработчики после активации
                document.removeEventListener('touchstart', enable);
                document.removeEventListener('click', enable);
                document.removeEventListener('keydown', enable);
            }
        };

        // Слушаем любое взаимодействие пользователя
        document.addEventListener('touchstart', enable, { once: false, passive: true });
        document.addEventListener('click', enable, { once: false, passive: true });
        document.addEventListener('keydown', enable, { once: false, passive: true });

        // Пытаемся включить сразу (может сработать на некоторых браузерах)
        try {
            noSleepRef.current.enable();
        } catch (err) {
            // Игнорируем - включится после первого взаимодействия
        }

        // Cleanup
        return () => {
            if (noSleepRef.current) {
                if (noSleepRef.current.isEnabled) {
                    noSleepRef.current.disable();
                }
                noSleepRef.current = null;
            }

            document.removeEventListener('touchstart', enable);
            document.removeEventListener('click', enable);
            document.removeEventListener('keydown', enable);
        };
    }, []);
};