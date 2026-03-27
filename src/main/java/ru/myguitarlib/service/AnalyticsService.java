package ru.myguitarlib.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import ru.myguitarlib.model.AnalyticsEvent;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.EventType;
import ru.myguitarlib.repository.AnalyticsRepository;

/**
 * Сервис записи аналитических событий.
 *
 * @Async — запись не блокирует основной запрос.
 * Требует @EnableAsync в главном классе приложения (MyGuitarLibApplication.java):
 *
 *   @EnableAsync
 *   @SpringBootApplication
 *   public class MyGuitarLibApplication { ... }
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;

    /**
     * Записать анонимное событие (без пользователя) — для публичных эндпоинтов.
     */
    @Async
    public void trackAnonymous(EventType eventType, String label, HttpServletRequest request) {
        track(null, eventType, label, request);
    }

    /**
     * Записать событие с данными HTTP-запроса (IP, deviceType, browser).
     */
    @Async
    public void track(User user, EventType eventType, String label, HttpServletRequest request) {
        try {
            AnalyticsEvent event = new AnalyticsEvent();
            event.setUser(user);
            event.setEventType(eventType);
            event.setLabel(label);

            if (request != null) {
                event.setIpAddress(extractIp(request));
                String ua = request.getHeader("User-Agent");
                event.setUserAgent(ua);
                event.setReferer(request.getHeader("Referer"));
                event.setDeviceType(detectDevice(ua));
                event.setBrowser(detectBrowser(ua));
            }

            analyticsRepository.save(event);
        } catch (Exception ignored) {
            // Аналитика не должна ломать основной запрос
        }
    }

    // ─── Вспомогательные ─────────────────────────────────────────────────────

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String detectDevice(String ua) {
        if (ua == null) return "unknown";
        String lower = ua.toLowerCase();
        if (lower.contains("tablet") || lower.contains("ipad"))             return "tablet";
        if (lower.contains("mobile") || lower.contains("android") || lower.contains("iphone")) return "mobile";
        return "desktop";
    }

    private String detectBrowser(String ua) {
        if (ua == null) return "unknown";
        if (ua.contains("Edg/"))                         return "Edge";
        if (ua.contains("OPR/") || ua.contains("Opera")) return "Opera";
        if (ua.contains("Chrome"))                        return "Chrome";
        if (ua.contains("Firefox"))                       return "Firefox";
        if (ua.contains("Safari"))                        return "Safari";
        return "Other";
    }
}