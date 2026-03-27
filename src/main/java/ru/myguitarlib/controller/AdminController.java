package ru.myguitarlib.controller;

import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.dto.PageDto;
import ru.myguitarlib.exception.ApiException;
import ru.myguitarlib.model.AnalyticsEvent;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.EventType;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.repository.AnalyticsRepository;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.mapper.SongMapper;

import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AnalyticsRepository analyticsRepository;
    private final UserRepository userRepository;
    private final SongRepository songRepository;

    // =========================================================
    //  Вложенные DTO — без лишних файлов
    // =========================================================

    /**
     * Плоское представление события аналитики — без Hibernate proxy.
     * Решает: Jackson не может сериализовать User$HibernateProxy.
     */
    public record AnalyticsEventDto(
            Long id,
            String eventType,
            String label,
            Long userId,
            String userEmail,
            String deviceType,
            String browser,
            String ipAddress,
            LocalDateTime createdAt
    ) {}

    /**
     * Представление пользователя для списка — с ролью.
     */
    public record AdminSongListDto(
            Long id,
            String artist,
            String title,
            Long ownerId,
            String ownerEmail
    ) {}

    public record UserDto(
            Long id,
            String email,
            String name,
            String role,
            LocalDateTime createdAt
    ) {}

    // =========================================================
    //  DASHBOARD
    // =========================================================

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        LocalDateTime now      = LocalDateTime.now();
        LocalDateTime dayAgo   = now.minusDays(1);
        LocalDateTime weekAgo  = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);

        Map<String, Object> stats = new HashMap<>();

        stats.put("dau", analyticsRepository.countDistinctUsersSince(dayAgo));
        stats.put("wau", analyticsRepository.countDistinctUsersSince(weekAgo));
        stats.put("mau", analyticsRepository.countDistinctUsersSince(monthAgo));

        stats.put("eventsToday", analyticsRepository.countEventsSince(dayAgo));
        stats.put("eventsWeek",  analyticsRepository.countEventsSince(weekAgo));
        stats.put("eventsMonth", analyticsRepository.countEventsSince(monthAgo));

        stats.put("totalUsers",  userRepository.count());
        stats.put("totalSongs",  songRepository.count());
        stats.put("totalEvents", analyticsRepository.count());

        stats.put("topEventTypes",      analyticsRepository.findTopEventTypes(monthAgo));
        stats.put("deviceDistribution", analyticsRepository.findDeviceDistribution(monthAgo));
        stats.put("browserDistribution",analyticsRepository.findBrowserDistribution(monthAgo));
        stats.put("activityByHour",     analyticsRepository.findActivityByHour(monthAgo));
        stats.put("activityByDayOfWeek",analyticsRepository.findActivityByDayOfWeek(monthAgo));

        Pageable top10 = PageRequest.of(0, 10);
        stats.put("topActiveUsers", analyticsRepository.findTopActiveUsers(monthAgo, top10));

        return ResponseEntity.ok(new ApiResponse<>(true, "Дашборд", stats, List.of()));
    }


    // =========================================================
    //  ANALYTICS
    // =========================================================

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<PageDto<AnalyticsEventDto>>> getAnalytics(
            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "20")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir,
            @RequestParam(required = false)           EventType eventType,
            @RequestParam(required = false)           Long userId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since
    ) {
        Pageable pageable = buildPageable(page, size, sortBy, sortDir);

        Page<AnalyticsEvent> pageResult;
        if (userId != null && eventType != null) {
            pageResult = analyticsRepository.findByUserIdAndEventType(userId, eventType, pageable);
        } else if (userId != null) {
            pageResult = analyticsRepository.findByUserId(userId, pageable);
        } else if (eventType != null) {
            pageResult = analyticsRepository.findByEventType(eventType, pageable);
        } else if (since != null) {
            pageResult = analyticsRepository.findByCreatedAtAfter(since, pageable);
        } else {
            pageResult = analyticsRepository.findAll(pageable);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Аналитика",
                toPageDto(pageResult.map(this::toEventDto)), List.of()));
    }

    @GetMapping("/analytics/{id}")
    public ResponseEntity<ApiResponse<AnalyticsEventDto>> getAnalyticsEvent(@PathVariable Long id) {
        AnalyticsEvent event = analyticsRepository.findById(id)
                .orElseThrow(() -> new ApiException("EVENT_NOT_FOUND", "Событие не найдено", HttpStatus.NOT_FOUND));

        return ResponseEntity.ok(new ApiResponse<>(true, "Событие", toEventDto(event), List.of()));
    }

    @GetMapping("/analytics/stats/{eventType}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEventTypeStats(
            @PathVariable EventType eventType
    ) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> stats = new HashMap<>();
        stats.put("eventType", eventType);
        stats.put("total",     analyticsRepository.countByEventType(eventType));
        stats.put("lastDay",   analyticsRepository.countByEventTypeSince(eventType, now.minusDays(1)));
        stats.put("lastWeek",  analyticsRepository.countByEventTypeSince(eventType, now.minusDays(7)));
        stats.put("lastMonth", analyticsRepository.countByEventTypeSince(eventType, now.minusDays(30)));

        return ResponseEntity.ok(new ApiResponse<>(true, "Статистика по " + eventType, stats, List.of()));
    }

    @DeleteMapping("/analytics/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnalyticsEvent(@PathVariable Long id) {
        AnalyticsEvent event = analyticsRepository.findById(id)
                .orElseThrow(() -> new ApiException("EVENT_NOT_FOUND", "Событие не найдено", HttpStatus.NOT_FOUND));

        analyticsRepository.delete(event);
        return ResponseEntity.ok(new ApiResponse<>(true, "Событие удалено", null, List.of()));
    }


    // =========================================================
    //  USERS
    // =========================================================

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageDto<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "id")   String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Pageable pageable = buildPageable(page, size, sortBy, sortDir);

        Page<UserDto> dtoPage = userRepository.findAll(pageable)
                .map(user -> new UserDto(
                        user.getId(),
                        user.getEmail(),
                        user.getName(),                                            // может быть null — фронтенд покажет прочерк
                        user.getRole() != null ? user.getRole().name() : "USER",  // роль для бейджа
                        user.getCreatedAt()
                ));

        return ResponseEntity.ok(new ApiResponse<>(true, "Все пользователи", toPageDto(dtoPage), List.of()));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND));

        Map<String, Object> details = new HashMap<>();
        details.put("id",        user.getId());
        details.put("email",     user.getEmail());
        details.put("name",      user.getName());
        details.put("role",      user.getRole() != null ? user.getRole().name() : "USER");
        details.put("createdAt", user.getCreatedAt());
        details.put("updatedAt", user.getUpdatedAt());

        details.put("totalSongs",  songRepository.countByOwnerId(user.getId()));
        details.put("totalEvents", analyticsRepository.countByUserId(user.getId()));

        // Маппируем в DTO — иначе Hibernate proxy упадёт при сериализации
        List<AnalyticsEventDto> lastEvents = analyticsRepository
                .findTop10ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toEventDto)
                .toList();
        details.put("lastEvents", lastEvents);

        return ResponseEntity.ok(new ApiResponse<>(true, "Профиль пользователя", details, List.of()));
    }

    @Transactional
    @GetMapping("/users/{id}/songs")
    public ResponseEntity<ApiResponse<PageDto<AdminSongListDto>>> getUserSongs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "id")   String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        if (!userRepository.existsById(id)) {
            throw new ApiException("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND);
        }

        Pageable pageable = buildPageable(page, size, sortBy, sortDir);
        Page<AdminSongListDto> dtoPage = songRepository.findByOwnerId(id, pageable)
                .map(song -> new AdminSongListDto(song.getId(), song.getArtist(), song.getTitle(), song.getOwner().getId(), song.getOwner().getEmail()));

        return ResponseEntity.ok(new ApiResponse<>(true, "Песни пользователя", toPageDto(dtoPage), List.of()));
    }

    @GetMapping("/users/{id}/analytics")
    public ResponseEntity<ApiResponse<PageDto<AnalyticsEventDto>>> getUserAnalytics(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0")         int page,
            @RequestParam(defaultValue = "20")        int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc")      String sortDir
    ) {
        if (!userRepository.existsById(id)) {
            throw new ApiException("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND);
        }

        Pageable pageable = buildPageable(page, size, sortBy, sortDir);
        Page<AnalyticsEventDto> dtoPage = analyticsRepository.findByUserId(id, pageable)
                .map(this::toEventDto);

        return ResponseEntity.ok(new ApiResponse<>(true, "Аналитика пользователя", toPageDto(dtoPage), List.of()));
    }

    @Transactional
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.NOT_FOUND));

        // Сначала удаляем связанные записи, иначе FK constraint нарушится
        analyticsRepository.deleteByUserId(id);
        songRepository.deleteByOwnerId(id);
        userRepository.delete(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Пользователь удалён", null, List.of()));
    }


    // =========================================================
    //  SONGS
    // =========================================================

    @Transactional
    @GetMapping("/songs")
    public ResponseEntity<ApiResponse<PageDto<AdminSongListDto>>> getAllSongs(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "id")   String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Pageable pageable = buildPageable(page, size, sortBy, sortDir);

        Page<AdminSongListDto> dtoPage = songRepository.findAllSongs(pageable)
                .map(song -> new AdminSongListDto(song.getId(), song.getArtist(), song.getTitle(), song.getOwner().getId(), song.getOwner().getEmail()));

        return ResponseEntity.ok(new ApiResponse<>(true, "Все песни", toPageDto(dtoPage), List.of()));
    }


    @Transactional
    @GetMapping("/songs/{id}")
    public ResponseEntity<ApiResponse<ru.myguitarlib.dto.song.SongDto>> getAdminSong(
            @PathVariable Long id) {

        Song song = songRepository.findById(id)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        return ResponseEntity.ok(new ApiResponse<>(true, "OK", SongMapper.toDto(song), List.of()));
    }

    @DeleteMapping("/songs/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSong(@PathVariable Long id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        songRepository.delete(song);
        return ResponseEntity.ok(new ApiResponse<>(true, "Песня удалена", null, List.of()));
    }


    // =========================================================
    //  Вспомогательные
    // =========================================================

    /**
     * Маппинг AnalyticsEvent → AnalyticsEventDto.
     * getId() и getEmail() работают даже на Hibernate proxy — они не требуют
     * инициализации прокси, в отличие от других полей.
     */
    private AnalyticsEventDto toEventDto(AnalyticsEvent e) {
        Long   userId    = null;
        String userEmail = null;

        if (e.getUser() != null) {
            try {
                userId    = e.getUser().getId();     // safe — id в прокси есть всегда
                userEmail = e.getUser().getEmail();  // может триггернуть загрузку — обёрнуто в try
            } catch (Exception ignored) {}
        }

        return new AnalyticsEventDto(
                e.getId(),
                e.getEventType() != null ? e.getEventType().name() : null,
                e.getLabel(),
                userId,
                userEmail,
                e.getDeviceType(),
                e.getBrowser(),
                e.getIpAddress(),
                e.getCreatedAt()
        );
    }

    private Pageable buildPageable(int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }

    private <T> PageDto<T> toPageDto(Page<T> p) {
        return new PageDto<>(
                p.getContent(),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages(),
                p.hasNext(),
                p.hasPrevious(),
                p.isFirst(),
                p.isLast()
        );
    }
}