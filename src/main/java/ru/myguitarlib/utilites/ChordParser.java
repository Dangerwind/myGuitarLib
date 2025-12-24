package ru.myguitarlib.utilites;

import org.springframework.stereotype.Component;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.model.song.SongChord;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ChordParser {

    private static final Pattern CHORD_PATTERN =
            Pattern.compile("\\b([A-G][#b]?m?(maj)?(?:[67]?|add|sus|dim|aug)?(?:/?[A-G][#b]?)?)\\b",
                    Pattern.CASE_INSENSITIVE);

    public Song parser(String artist, String title, String rawText) {
        Song song = new Song();
        song.setTitle(title);
        song.setArtist(artist);

        String[] split = rawText.split("\\R");

        List<SongChord> chords = new ArrayList<>();
        StringBuilder lyrics = new StringBuilder();

        int indexLine = 0;

        int flagWas = 0;  // 0 - ожидаются аккорды, 1 - ожидается текст

        for (var i = 0; i < split.length; i++) {

            Matcher matcher = CHORD_PATTERN.matcher(split[i]);

            if (matcher.find()) {

                matcher.reset();
                while(matcher.find()) {
                    var newChord = new SongChord();
                    newChord.setSong(song);
                    newChord.setCharIndex(matcher.start());
                    newChord.setLineIndex(indexLine);
                    newChord.setChord(matcher.group(1));
                    chords.add(newChord);
                }
                indexLine++;

                if(flagWas == 1) {  // если подряд акорды то добавить пустой текст
                    lyrics.append(System.lineSeparator());
                }
                flagWas = 1;  // дальше ожидается текст

            } else {
                lyrics.append(split[i]).append(System.lineSeparator());

                if (flagWas == 0) { // если был текст и опять текст - добавить строку аккодов
                    indexLine++;
                }
                flagWas = 0; // дальше ожидаются аккорды
            }
        }

        song.setLyrics(lyrics.toString().trim());
        song.setChords(chords);

        return song;
    }
}
