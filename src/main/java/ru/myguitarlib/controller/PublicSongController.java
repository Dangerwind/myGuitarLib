package ru.myguitarlib.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.dto.song.SongDto;
import ru.myguitarlib.exception.ApiException;
import ru.myguitarlib.mapper.SongMapper;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.service.AnalyticsService;
import ru.myguitarlib.service.ShareTokenService;
import ru.myguitarlib.model.enums.EventType;

import java.util.List;

/**
 * Публичные эндпоинты — без авторизации.
 * SecurityConfig должен иметь .requestMatchers("/api/v1/public/**").permitAll()
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public")
public class PublicSongController {

    private final SongRepository    songRepository;
    private final ShareTokenService shareTokenService;
    private final AnalyticsService     analyticsService;

    /**
     * Получить песню по токену-ссылке.
     * GET /api/v1/public/song?token=42.xK8mN3pQ...
     */
    @GetMapping("/song")
    public ResponseEntity<ApiResponse<SongDto>> getSongByToken(
            @RequestParam String token,
            HttpServletRequest request
    ) {
        Long songId;
        try {
            songId = shareTokenService.validateToken(token);
        } catch (IllegalArgumentException e) {
            throw new ApiException("INVALID_TOKEN", "Неверная или устаревшая ссылка", HttpStatus.BAD_REQUEST);
        }

        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        SongDto dto = SongMapper.toDto(song);
        analyticsService.trackAnonymous(
                EventType.SONG_SHARED_VIEW,
                song.getArtist() + " — " + song.getTitle(),
                request
        );
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", dto, List.of()));
    }
}