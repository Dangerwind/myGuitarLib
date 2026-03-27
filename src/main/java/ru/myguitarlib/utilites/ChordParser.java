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

    // Паттерн одного аккорда
    private static final Pattern CHORD_PATTERN = Pattern.compile(
            "([A-G][#b]?" +                          // нота: C, D#, Bb
                    "(?:maj|m|dim|aug)?" +                    // качество: maj, m, dim, aug
                    "(?:maj7|maj9|maj11|maj13|" +             // maj с цифрой
                    "m7b5|m7|m9|m11|m13|madd9|" +            // минорные с цифрой
                    "7b5|7sus4|7sus2|9sus4|" +               // септ с дополнением
                    "13|11|9|7|6\\/9|6|5|" +                 // просто цифры
                    "add(?:11|9|2)|" +                        // add
                    "sus[24]|" +                              // sus
                    "dim7|dim|aug)?" +                        // dim/aug
                    "(?:\\/[A-G][#b]?)?)"                     // бас: /G, /F#
    );

    // если перед всеми строками есть много отступов, определяет сколько отступов везде и удаляет их
    private String[] trimLines(String[] lines) {
        if (lines == null || lines.length == 0) return lines;

        String[] trimmedLines = new String[lines.length];

        int minSpace = Integer.MAX_VALUE;

        for (String line : lines) {
            if (line == null || line.isBlank()) continue;
            minSpace = Math.min(minSpace, line.indexOf(line.strip().charAt(0)));
        }

        if (minSpace == 0 || minSpace == Integer.MAX_VALUE) {
            return lines;
        }

        for (var i = 0; i < lines.length; i++) {

            if (lines[i] == null || lines[i].isBlank()) {
                trimmedLines[i] = lines[i];
                continue;
            }
            trimmedLines[i] = lines[i].substring(minSpace).stripTrailing();
        }
        return trimmedLines;
    }


    // Строка считается строкой аккордов если:
    // - содержит хотя бы один аккорд
    // - состоит ТОЛЬКО из аккордов и пробелов (нет других слов/кириллицы)
    private boolean isChordLine(String line) {
        if (line.isBlank()) return false;

        // Если есть кириллические символы — это текстовая строка
        if (line.matches(".*[а-яёА-ЯЁ].*")) return false;

        // Убираем все аккорды и пробелы — должно остаться пусто
        String withoutChords = CHORD_PATTERN.matcher(line).replaceAll("").trim();
        // Допускаем только пробелы после удаления аккордов
        if (!withoutChords.isEmpty()) return false;

        // Проверяем что хотя бы один аккорд есть
        return CHORD_PATTERN.matcher(line).find();
    }

    public Song parser(String artist, String title, String rawText) {
        Song song = new Song();
        if (title == null || title.isBlank()) {
            song.setTitle("! не указано");
        } else {
            song.setTitle(title);
        }
        if (artist == null || artist.isBlank()) {
            song.setArtist("! не указан");
        } else {
            song.setArtist(artist);
        }


        String[] lines = trimLines(rawText.split("\\R", -1));

        List<SongChord> chords = new ArrayList<>();
        StringBuilder lyrics = new StringBuilder();
        int textLineIndex = 0; // индекс текущей текстовой строки в lyrics

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];

            if (isChordLine(line)) {
                // Строка аккордов — извлекаем аккорды с их позициями
                // lineIndex = индекс СЛЕДУЮЩЕЙ текстовой строки
                Matcher matcher = CHORD_PATTERN.matcher(line);
                while (matcher.find()) {
                    SongChord chord = new SongChord();
                    chord.setSong(song);
                    chord.setChord(matcher.group(1));
                    chord.setCharIndex(matcher.start());
                    chord.setLineIndex(textLineIndex); // индекс следующей текстовой строки
                    chords.add(chord);
                }
                // Если следующая строка тоже аккорды (нет текста между ними) —
                // нужно добавить пустую текстовую строку
                if (i + 1 < lines.length && isChordLine(lines[i + 1])) {
                    lyrics.append("").append(System.lineSeparator());
                    textLineIndex++;
                }
            } else {
                // Текстовая строка (включая пустые)
                lyrics.append(line).append(System.lineSeparator());
                textLineIndex++;
            }
        }

        song.setLyrics(lyrics.toString().stripTrailing());
        song.setChords(chords);
        return song;
    }
}