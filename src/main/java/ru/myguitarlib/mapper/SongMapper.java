package ru.myguitarlib.mapper;

import ru.myguitarlib.dto.song.SongChordDto;
import ru.myguitarlib.dto.song.SongDto;
import ru.myguitarlib.dto.song.SongUpsertDto;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.model.song.SongChord;

import java.util.List;

public final class SongMapper {
    private SongMapper() {}

    public static SongDto toDto(Song song) {
        SongDto dto = new SongDto();

        dto.setFontSize(song.getFontSize());
     //   dto.setTonality(song.getTonality());
        dto.setScrollSpeed(song.getScrollSpeed());

        dto.setId(song.getId());
        dto.setArtist(song.getArtist());
        dto.setTitle(song.getTitle());
        dto.setComment(song.getComment());
        dto.setLyrics(song.getLyrics());

        List<SongChordDto> chords = song.getChords().stream()
                .map(SongMapper::toChordDto)
                .toList();

        dto.setChords(chords);
        return dto;
    }

    public static void applyUpsert(Song song, SongUpsertDto dto) {
        song.setArtist(dto.getArtist());
        song.setTitle(dto.getTitle());
        song.setComment(dto.getComment());
        song.setLyrics(dto.getLyrics());

      //  song.setTonality(dto.getTonality());
        song.setScrollSpeed(dto.getScrollSpeed());
        song.setFontSize(dto.getFontSize());

        // полная замена аккордов
        song.getChords().clear();
        if (dto.getChords() != null) {
            for (SongChordDto chDto : dto.getChords()) {
                SongChord ch = new SongChord();
                ch.setSong(song);
                ch.setLineIndex(chDto.getLineIndex());
                ch.setCharIndex(chDto.getCharIndex());
                ch.setChord(chDto.getChord());
                song.getChords().add(ch);
            }
        }
    }

    private static SongChordDto toChordDto(SongChord chord) {
        SongChordDto dto = new SongChordDto();
        dto.setId(chord.getId());
        dto.setLineIndex(chord.getLineIndex());
        dto.setCharIndex(chord.getCharIndex());
        dto.setChord(chord.getChord());
        return dto;
    }
}

