package ru.myguitarlib.dto.song;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SongChordDto {

    private Long id;


    private Integer scrollSpeed;
    private Integer fontSize;
    private Integer tonality;

    private int lineIndex;
    private int charIndex;
    private String chord;
}
