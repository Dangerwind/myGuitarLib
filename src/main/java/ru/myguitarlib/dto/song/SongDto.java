package ru.myguitarlib.dto.song;

import jakarta.persistence.Column;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SongDto {

    private Long id;

    private Integer scrollSpeed;
    private Integer fontSize;
    private Integer tonality;

    private String artist;
    private String title;
    private String comment;
    private String lyrics;

    private List<SongChordDto> chords;


}
