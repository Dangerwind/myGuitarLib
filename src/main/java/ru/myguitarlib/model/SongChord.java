package ru.myguitarlib.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "song_chords")
public class SongChord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "song_id")
    private Song song;

    private int lineIndex;     // номер строки в lyrics (0-based)
    private int charIndex;     // индекс символа в строке (0-based)
    private String chord;      // "Am", "Dm/F", и т.п.
}