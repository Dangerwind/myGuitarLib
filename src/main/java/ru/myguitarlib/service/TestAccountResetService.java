package ru.myguitarlib.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.myguitarlib.init.DemoDataInitializer;
import ru.myguitarlib.model.User;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class TestAccountResetService {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final DemoDataInitializer demoDataInitializer;

    @Scheduled(cron = "0 0 3 * * *") // каждый день в 3 ночи

    // @Scheduled(cron = "0 */2 * * * *") // каждые 2 минут
    @Transactional
    public void resetTestAccount() {
        User testUser = userRepository.findByEmail("test").orElse(null);
        if (testUser == null) {
            log.warn("Тестовый аккаунт не найден, сброс пропущен");
            return;
        }

        // Удаляем все песни тестового пользователя
        songRepository.deleteAllByOwner(testUser);
        log.info("Песни тестового аккаунта удалены");

        // Восстанавливаем демо-песни
        demoDataInitializer.createDemoSongs(testUser);
        log.info("Тестовый аккаунт успешно сброшен");
    }
}