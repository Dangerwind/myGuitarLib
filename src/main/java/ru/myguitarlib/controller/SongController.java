package ru.myguitarlib.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.utilites.ChordParser;
import ru.myguitarlib.utilites.ChordTransposer;


import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/song")
public class SongController {

    private final SongRepository songRepository;
    private final UserRepository userRepository;
    private final ChordParser chordParser;


    @Autowired
    private ChordTransposer transposer;

    // ---------- парсер слов и аккордов ----------
    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<SongDto>> parseSong(
            @RequestBody SongParseDto dto,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = getUser(jwt).getId();
        var user = userRepository.findById(userId)
                .orElseThrow( () -> new  ApiException("USER_NOT_FOUND", "Проблема доступа", HttpStatus.UNAUTHORIZED));

        Song song = chordParser.parser(dto.getArtist(), dto.getTitle(), dto.getRawText());
        song.setOwner(user);
        song.setComment("");
        song = songRepository.save(song);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Песня создана", SongMapper.toDto(song), List.of()));

    }




    // ---------- READ: list + search + sort ----------
    @GetMapping
    public ResponseEntity<ApiResponse<List<ArtistTitleDto>>> getIndex(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "artist") String sortBy, // artist|title
            @RequestParam(defaultValue = "asc") String dir       // asc|desc
    ) {
        Long userId = getUser(jwt).getId();

        if (!sortBy.equals("artist") && !sortBy.equals("title")) {
            throw new ApiException("BAD_SORT", "sortBy может быть только 'artist' или 'title'", HttpStatus.BAD_REQUEST);
        }

        Direction direction = dir.equalsIgnoreCase("desc") ? Direction.DESC : Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);

        // один репо-метод для всех случаев
        List<ArtistTitleDto> songList = songRepository.findIndex(userId, normalizeQuery(q), sort);

        return ResponseEntity.ok(new ApiResponse<>(true, "Песни пользователя", songList, List.of()));
    }

    // ---------- READ: one ----------
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SongDto>> getSong(
            @RequestParam(required = false) Integer ton,
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = getUser(jwt).getId();

        Song song = songRepository.findByIdAndOwnerIdWithChords(id, userId)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

       // ChordTransposer - транспонирование

        int tonality = ton != null ? ton : 0;

        for (var chh : song.getChords()) {
            chh.setChord(transposer.transpose(chh.getChord(), tonality));
            // chh.setChord("ton="+tonality);
        }


        return ResponseEntity.ok(new ApiResponse<>(true, "Песня получена", SongMapper.toDto(song), List.of()));
    }


    // ---------- CREATE ----------
    @PostMapping
    public ResponseEntity<ApiResponse<SongDto>> createSong(@RequestBody SongUpsertDto dto,
                                                           @AuthenticationPrincipal Jwt jwt) {
        User user = getUser(jwt);

        Song song = new Song();
        song.setOwner(user);
        SongMapper.applyUpsert(song, dto);

        Song saved = songRepository.save(song);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Песня создана", SongMapper.toDto(saved), List.of()));
    }

    // ---------- UPDATE ----------
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SongDto>> updateSong(@PathVariable Long id,
                                                           @RequestBody SongUpsertDto dto,
                                                           @AuthenticationPrincipal Jwt jwt) {
        Long userId = getUser(jwt).getId();

        Song song = songRepository.findByIdAndOwnerIdWithChords(id, userId)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        SongMapper.applyUpsert(song, dto);

        Song saved = songRepository.save(song);

        return ResponseEntity.ok(new ApiResponse<>(true, "Песня обновлена", SongMapper.toDto(saved), List.of()));
    }

    // ---------- DELETE ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSong(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        Long userId = getUser(jwt).getId();

        Song song = songRepository.findByIdAndOwnerId(id, userId)
                .orElseThrow(() -> new ApiException("SONG_NOT_FOUND", "Песня не найдена", HttpStatus.NOT_FOUND));

        songRepository.delete(song);

        return ResponseEntity.ok(new ApiResponse<>(true, "Песня удалена", null, List.of()));
    }


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
