package ru.myguitarlib.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.myguitarlib.model.AnalyticsEvent;
import ru.myguitarlib.model.enums.EventType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface AnalyticsRepository extends JpaRepository<AnalyticsEvent, Long> {

    Page<AnalyticsEvent> findByEventType(EventType eventType, Pageable pageable);

    Page<AnalyticsEvent> findByUserId(Long userId, Pageable pageable);

    Page<AnalyticsEvent> findByCreatedAtAfter(LocalDateTime since, Pageable pageable);

    Page<AnalyticsEvent> findByUserIdAndEventType(Long userId, EventType eventType, Pageable pageable);

    // ========== Статистика ==========

    @Query("SELECT COUNT(DISTINCT e.user.id) FROM AnalyticsEvent e WHERE e.createdAt >= :since")
    Long countDistinctUsersSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM AnalyticsEvent e WHERE e.createdAt >= :since")
    Long countEventsSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(e) FROM AnalyticsEvent e " +
            "WHERE e.eventType = :eventType AND e.createdAt >= :since")
    Long countByEventTypeSince(@Param("eventType") EventType eventType,
                               @Param("since") LocalDateTime since);

    @Query("SELECT e.eventType as type, COUNT(e) as count " +
            "FROM AnalyticsEvent e " +
            "WHERE e.createdAt >= :since " +
            "GROUP BY e.eventType " +
            "ORDER BY COUNT(e) DESC")
    List<Map<String, Object>> findTopEventTypes(@Param("since") LocalDateTime since);

    @Query("SELECT e.user.id as userId, e.user.email as email, COUNT(e) as count " +
            "FROM AnalyticsEvent e " +
            "WHERE e.createdAt >= :since " +
            "GROUP BY e.user.id, e.user.email " +
            "ORDER BY COUNT(e) DESC")
    List<Map<String, Object>> findTopActiveUsers(@Param("since") LocalDateTime since,
                                                 Pageable pageable);

    @Query("SELECT e.user.id as userId, e.user.email as email, COUNT(e) as count " +
            "FROM AnalyticsEvent e " +
            "WHERE e.createdAt >= :since " +
            "GROUP BY e.user.id, e.user.email " +
            "ORDER BY COUNT(e) DESC")
    List<Object[]> findTop10ActiveUsers(@Param("since") LocalDateTime since, Pageable pageable);

    @Query("SELECT e.deviceType as deviceType, COUNT(e) as count " +
            "FROM AnalyticsEvent e " +
            "WHERE e.createdAt >= :since " +
            "GROUP BY e.deviceType " +
            "ORDER BY COUNT(e) DESC")
    List<Map<String, Object>> findDeviceDistribution(@Param("since") LocalDateTime since);

    @Query("SELECT e.browser as browser, COUNT(e) as count " +
            "FROM AnalyticsEvent e " +
            "WHERE e.createdAt >= :since " +
            "GROUP BY e.browser " +
            "ORDER BY COUNT(e) DESC")
    List<Map<String, Object>> findBrowserDistribution(@Param("since") LocalDateTime since);

    // Нативный запрос — EXTRACT работает только в SQL, не в JPQL
    @Query(value = "SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count " +
            "FROM analytics_events " +
            "WHERE created_at >= :since " +
            "GROUP BY EXTRACT(HOUR FROM created_at) " +
            "ORDER BY EXTRACT(HOUR FROM created_at)",
            nativeQuery = true)
    List<Map<String, Object>> findActivityByHour(@Param("since") LocalDateTime since);

    @Query(value = "SELECT EXTRACT(DOW FROM created_at) as dayOfWeek, COUNT(*) as count " +
            "FROM analytics_events " +
            "WHERE created_at >= :since " +
            "GROUP BY EXTRACT(DOW FROM created_at) " +
            "ORDER BY EXTRACT(DOW FROM created_at)",
            nativeQuery = true)
    List<Map<String, Object>> findActivityByDayOfWeek(@Param("since") LocalDateTime since);

    List<AnalyticsEvent> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByUserId(Long userId);

    Long countByEventType(EventType eventType);

    void deleteByUserId(Long userId);
}