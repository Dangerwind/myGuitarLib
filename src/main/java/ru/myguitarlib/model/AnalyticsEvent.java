package ru.myguitarlib.model;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import ru.myguitarlib.model.enums.EventType;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_event_type", columnList = "event_type"),
        @Index(name = "idx_created_at", columnList = "created_at"),
        @Index(name = "idx_user_created", columnList = "user_id,created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Кто
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // что делал
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EventType eventType;

    @Column(length = 255)
    private String label;

    // Когда
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Технические данные
    @Column(length = 45)
    private String ipAddress;

    // браузер и ОС
    @Column(length = 500)
    private String userAgent;

    // откуда пришли
    @Column(length = 500)
    private String referer;

    // desktop, mobile, tablet
    @Column(length = 20)
    private String deviceType;

    // Chrome, Firefox, Safari
    @Column(length = 50)
    private String browser;
}