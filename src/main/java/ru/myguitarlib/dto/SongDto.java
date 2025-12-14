package ru.myguitarlib.dto;

import java.util.List;

public class SongDto {

    private Long id;
    private String artist;
    private String title;
    private String comment;
    private String lyrics;
    private List<SongChordDto> chords;
}
