package ru.myguitarlib.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SongChordDto {
    private Long id;
    private int lineIndex;
    private int charIndex;
    private String chord;
}
