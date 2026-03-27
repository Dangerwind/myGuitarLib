package ru.myguitarlib.dto.song;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ArtistTitleDto {
    private Long id;
    private String artist;
    private String title;
    private String comment;
}