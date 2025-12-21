package ru.myguitarlib.dto.song;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ArtistTitleDto {

     private Long id;
    private String artist;
    private String title;
}
