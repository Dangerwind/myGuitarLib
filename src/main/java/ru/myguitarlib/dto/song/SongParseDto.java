package ru.myguitarlib.dto.song;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SongParseDto {

    private String artist;
    private String title;
    private String rawText;
}
