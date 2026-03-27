package ru.myguitarlib.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.dto.song.ArtistTitleDto;
import ru.myguitarlib.dto.song.SongDto;
import ru.myguitarlib.dto.song.SongParseDto;
import ru.myguitarlib.dto.song.SongUpsertDto;
import ru.myguitarlib.exception.ApiException;
import ru.myguitarlib.mapper.SongMapper;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.EventType;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.service.AnalyticsService;
import ru.myguitarlib.service.ShareTokenService;
import ru.myguitarlib.utilites.ChordParser;
import ru.myguitarlib.utilites.ChordTransposer;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/song")
public class SongController {

    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final ChordParser chordParser;
    private final ChordTransposer transposer;
    private final AnalyticsService analyticsService;
    private final ShareTokenService shareTokenService;

    // ---------- Импорт / парсинг ----------

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<SongDto>> parseSong(
            @RequestBody SongParseDto dto,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        User user = getUser(jwt);

        Song song = chordParser.parser(dto.getArtist(), dto.getTitle(), dto.getRawText());
        song.setOwner(user);
        song.setComment("");
        song = songRepository.save(song);

        analyticsService.track(user, EventType.SONG_IMPORT,
                dto.getArtist() + " — " + dto.getTitle(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Песня создана", SongMapper.toDto(song), List.of()));
    }

    // ---------- Список + поиск + сортировка ----------

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArtistTitleDto>>> getIndex(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "artist") String sortBy,
            @RequestParam(defaultValue = "asc") String dir,
            HttpServletRequest request) {

        User user = getUser(jwt);

        if (!sortBy.equals("artist") && !sortBy.equals("title")) {
            throw new ApiException("BAD_SORT", "sortBy может быть только 'artist' или 'title'", HttpStatus.BAD_REQUEST);
        }

        Direction direction = dir.equalsIgnoreCase("desc") ? Direction.DESC : Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);

        List<ArtistTitleDto> songList = songRepository.findIndex(user.getId(), normalizeQuery(q), sort);

        // Записываем SONG_SEARCH только если был поисковый запрос
        if (q != null && !q.isBlank()) {
            analyticsService.track(user, EventType.SONG_SEARCH, q.trim(), request);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Песни пользователя", songList, List.of()));
    }

    // ---------- Одна песня ----------

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SongDto>> getSong(
            @RequestParam(required = false) Integer ton,
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        User user = getUser(jwt);

        Song song = songRepository.findByIdAndOwnerIdWithChords(id, user.getId())
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        int tonality = ton != null ? ton : 0;
        for (var chord : song.getChords()) {
            chord.setChord(transposer.transpose(chord.getChord(), tonality));
        }

        // SONG_TONALITY_CHANGE только если запрошена нестандартная тональность
        if (ton != null && ton != 0) {
            analyticsService.track(user, EventType.SONG_TONALITY_CHANGE,
                    song.getArtist() + " — " + song.getTitle() + " [ton=" + ton + "]", request);
        } else {
            analyticsService.track(user, EventType.SONG_VIEW,
                    song.getArtist() + " — " + song.getTitle(), request);
        }

        return ResponseEntity.ok(new ApiResponse<>(true, "Песня получена", SongMapper.toDto(song), List.of()));
    }

    // ---------- Создание ----------

    @PostMapping
    public ResponseEntity<ApiResponse<SongDto>> createSong(
            @RequestBody SongUpsertDto dto,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        User user = getUser(jwt);

        Song song = new Song();
        song.setOwner(user);
        SongMapper.applyUpsert(song, dto);
        Song saved = songRepository.save(song);

        analyticsService.track(user, EventType.SONG_CREATE,
                dto.getArtist() + " — " + dto.getTitle(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Песня создана", SongMapper.toDto(saved), List.of()));
    }

    // ---------- Обновление ----------

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SongDto>> updateSong(
            @PathVariable Long id,
            @RequestBody SongUpsertDto dto,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        User user = getUser(jwt);

        Song song = songRepository.findByIdAndOwnerIdWithChords(id, user.getId())
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        SongMapper.applyUpsert(song, dto);
        Song saved = songRepository.save(song);

        analyticsService.track(user, EventType.SONG_EDIT,
                dto.getArtist() + " — " + dto.getTitle(), request);

        return ResponseEntity.ok(new ApiResponse<>(true, "Песня обновлена", SongMapper.toDto(saved), List.of()));
    }

    // ---------- Удаление ----------

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSong(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        User user = getUser(jwt);

        Song song = songRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        analyticsService.track(user, EventType.SONG_DELETE,
                song.getArtist() + " — " + song.getTitle(), request);

        songRepository.delete(song);

        return ResponseEntity.ok(new ApiResponse<>(true, "Песня удалена", null, List.of()));
    }


    // ---------- Поделиться ----------

    /**
     * Возвращает защищённый share-токен для песни.
     * Только владелец песни может получить токен.
     * GET /api/v1/song/{id}/share-token
     */
    @GetMapping("/{id}/share-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getShareToken(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        User user = getUser(jwt);

        songRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        String token = shareTokenService.generateToken(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", Map.of("token", token), List.of()));
    }

    /**
     * Копирует песню из публичной ссылки в библиотеку текущего пользователя.
     * POST /api/v1/song/copy?token=xxx
     */
    @Transactional
    @PostMapping("/copy")
    public ResponseEntity<ApiResponse<SongDto>> copySong(
            @RequestParam String token,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {

        Long songId;
        try {
            songId = shareTokenService.validateToken(token);
        } catch (IllegalArgumentException e) {
            throw new ApiException("INVALID_TOKEN", "Неверная ссылка", HttpStatus.BAD_REQUEST);
        }

        Song original = songRepository.findById(songId)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        User user = getUser(jwt);

        Song copy = new Song();
        copy.setOwner(user);
        copy.setArtist(original.getArtist());
        copy.setTitle(original.getTitle());
        copy.setComment(original.getComment());
        copy.setLyrics(original.getLyrics());
        copy.setFontSize(original.getFontSize());
        copy.setScrollSpeed(original.getScrollSpeed());
        copy.setTonality(original.getTonality());
        Song saved = songRepository.save(copy);

        // Копируем аккорды
        if (original.getChords() != null && !original.getChords().isEmpty()) {
            original.getChords().forEach(ch -> {
                ru.myguitarlib.model.song.SongChord newChord = new ru.myguitarlib.model.song.SongChord();
                newChord.setSong(saved);
                newChord.setLineIndex(ch.getLineIndex());
                newChord.setCharIndex(ch.getCharIndex());
                newChord.setChord(ch.getChord());
                saved.getChords().add(newChord);
            });
            songRepository.save(saved);
        }

        analyticsService.track(user, EventType.SONG_CREATE,
                copy.getArtist() + " — " + copy.getTitle(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Песня добавлена в вашу библиотеку", SongMapper.toDto(saved), List.of()));
    }

    // ─── Вспомогательные ─────────────────────────────────────────────────────

    private String normalizeQuery(String q) {
        if (q == null) return null;
        String trimmed = q.trim();
        return trimmed.isEmpty() ? "" : trimmed;
    }

    private User getUser(Jwt jwt) {
        String email = jwt.getSubject();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "Пользователь не найден", HttpStatus.UNAUTHORIZED));
    }
}
