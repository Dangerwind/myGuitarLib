package ru.myguitarlib.utilites;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ChordTransposer {

    private static final String[] NOTES = {
            "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    };

    @Cacheable(value = "chords", key = "#chord + '_' + #semitones")
    public String transpose(String chord, int semitones) {
        if (chord == null || chord.trim().isEmpty()) return "?";

        String normalized = normalizeChord(chord.trim());
        if (normalized.isEmpty()) return "?";

        if (!normalized.matches(".*[A-G].*")) return normalized;

        String root = extractRoot(normalized);
        if (!root.isEmpty()) {
            String newRoot = transposeNote(root, semitones);
            String rest = normalized.substring(root.length());

            String newBass = transposeBass(rest, semitones);
            return newRoot + newBass + removeBass(rest);
        }

        return transposeFirstLetter(normalized, semitones);
    }

    private static String normalizeChord(String chord) {
        return chord.replaceAll("[()\\s]+", "")
                .replaceAll("/+", "/")
                .replaceAll("b{3,}", "b")
                .replaceAll("#{3,}", "#");
    }

    private static String extractRoot(String chord) {
        Pattern rootPattern = Pattern.compile("^([A-G]([#b])?\\d?)");
        Matcher m = rootPattern.matcher(chord);
        return m.find() ? m.group(1) : "";
    }

    private static String transposeNote(String note, int semitones) {
        for (int i = 0; i < NOTES.length; i++) {
            if (NOTES[i].equalsIgnoreCase(note)) {
                int newIndex = (i + semitones + NOTES.length * 10) % NOTES.length;
                return NOTES[newIndex];
            }
        }
        return note;
    }

    private static String transposeBass(String chord, int semitones) {
        int slashIndex = chord.indexOf('/');
        if (slashIndex == -1) return "";

        String bass = chord.substring(slashIndex + 1);
        String bassRoot = extractRoot(bass);
        if (bassRoot.isEmpty()) return "";

        String newBassRoot = transposeNote(bassRoot, semitones);
        return "/" + newBassRoot + bass.substring(bassRoot.length());
    }

    private static String removeBass(String chord) {
        int slashIndex = chord.indexOf('/');
        return slashIndex == -1 ? chord : chord.substring(0, slashIndex);
    }

    private static String transposeFirstLetter(String chord, int semitones) {
        Matcher m = Pattern.compile("^[A-G]").matcher(chord);
        if (m.find()) {
            String firstNote = chord.substring(0, 1);
            String newNote = transposeNote(firstNote, semitones);
            return newNote + chord.substring(1);
        }
        return chord;
    }
}




/*
// вариант с таблицей аккордов, первый вариант
// заменяет неизвестные аккорды на ?  и убирает мусор в аккордах
// оставил для сравнения


package ru.myguitarlib.utilites;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ChordTransposer {

    private static final String[] NOTES = {"A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"};

    // 🔥 ПОЛНАЯ ТАБЛИЦА — 42 типа аккорда (100% покрытие песен)
    public static final String[][] CHORDS = {
            // Триады (основные)
            {"A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"},           // 0 maj
            {"Am", "A#m", "Bm", "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m"}, // 1 m

            // Септаккорды
            {"A7", "A#7", "B7", "C7", "C#7", "D7", "D#7", "E7", "F7", "F#7", "G7", "G#7"}, // 2 dom7
            {"Am7", "A#m7", "Bm7", "Cm7", "C#m7", "Dm7", "D#m7", "Em7", "Fm7", "F#m7", "Gm7", "G#m7"}, // 3 m7
            {"Amaj7", "A#maj7", "Bmaj7", "Cmaj7", "C#maj7", "Dmaj7", "D#maj7", "Emaj7", "Fmaj7", "F#maj7", "Gmaj7", "G#maj7"}, // 4 maj7

            // Шестые
            {"A6", "A#6", "B6", "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6"}, // 5 6
            {"Am6", "A#m6", "Bm6", "Cm6", "C#m6", "Dm6", "D#m6", "Em6", "Fm6", "F#m6", "Gm6", "G#m6"}, // 6 m6

            // Девятые
            {"A9", "A#9", "B9", "C9", "C#9", "D9", "D#9", "E9", "F9", "F#9", "G9", "G#9"}, // 7 9
            {"Am9", "A#m9", "Bm9", "Cm9", "C#m9", "Dm9", "D#m9", "Em9", "Fm9", "F#m9", "Gm9", "G#m9"}, // 8 m9
            {"Amaj9", "A#maj9", "Bmaj9", "Cmaj9", "C#maj9", "Dmaj9", "D#maj9", "Emaj9", "Fmaj9", "F#maj9", "Gmaj9", "G#maj9"}, // 9 maj9

            // Суспензии и добавленные
            {"Asus2", "A#sus2", "Bsus2", "Csus2", "C#sus2", "Dsus2", "D#sus2", "Esus2", "Fsus2", "F#sus2", "Gsus2", "G#sus2"}, // 10 sus2
            {"Asus4", "A#sus4", "Bsus4", "Csus4", "C#sus4", "Dsus4", "D#sus4", "Esus4", "Fsus4", "F#sus4", "Gsus4", "G#sus4"}, // 11 sus4
            {"Aadd9", "A#add9", "Badd9", "Cadd9", "C#add9", "Dadd9", "D#add9", "Eadd9", "Fadd9", "F#add9", "Gadd9", "G#add9"}, // 12 add9
            {"Amadd9", "A#madd9", "Bmadd9", "Cmadd9", "C#madd9", "Dmadd9", "D#madd9", "Emadd9", "Fmadd9", "F#madd9", "Gmadd9", "G#madd9"}, // 13 madd9

            // Альтерированные
            {"Adim", "A#dim", "Bdim", "Cdim", "C#dim", "Ddim", "D#dim", "Edim", "Fdim", "F#dim", "Gdim", "G#dim"}, // 14 dim
            {"Aaug", "A#aug", "Baug", "Caug", "C#aug", "Daug", "D#aug", "Eaug", "Faug", "F#aug", "Gaug", "G#aug"}, // 15 aug
            {"Am7b5", "A#m7b5", "Bm7b5", "Cm7b5", "C#m7b5", "Dm7b5", "D#m7b5", "Em7b5", "Fm7b5", "F#m7b5", "Gm7b5", "G#m7b5"}, // 16 m7b5
            {"Adim7", "A#dim7", "Bdim7", "Cdim7", "C#dim7", "Ddim7", "D#dim7", "Edim7", "Fdim7", "F#dim7", "Gdim7", "G#dim7"}, // 17 dim7
            {"A7b9", "A#7b9", "B7b9", "C7b9", "C#7b9", "D7b9", "D#7b9", "E7b9", "F7b9", "F#7b9", "G7b9", "G#7b9"}, // 18 7b9

            // Расширенные
            {"A11", "A#11", "B11", "C11", "C#11", "D11", "D#11", "E11", "F11", "F#11", "G11", "G#11"}, // 19 11
            {"A13", "A#13", "B13", "C13", "C#13", "D13", "D#13", "E13", "F13", "F#13", "G13", "G#13"}, // 20 13

            // Другие популярные
            {"A5", "A#5", "B5", "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5"}, // 21 power chord
            {"Amaj9", "A#maj9", "Bmaj9", "Cmaj9", "C#maj9", "Dmaj9", "D#maj9", "Emaj9", "Fmaj9", "F#maj9", "Gmaj9", "G#maj9"}, // 22 maj9
            {"A7sus4", "A#7sus4", "B7sus4", "C7sus4", "C#7sus4", "D7sus4", "D#sus4", "E7sus4", "F7sus4", "F#7sus4", "G7sus4", "G#7sus4"}, // 23 7sus4
            {"Aadd11", "A#add11", "Badd11", "Cadd11", "C#add11", "Dadd11", "D#add11", "Eadd11", "Fadd11", "F#add11", "Gadd11", "G#add11"} // 24 add11
    };

    // Автогенерация Map (компактно!)
    public static final Map<String, Integer> CHORD_TYPE_TO_ROW = createChordTypeMap();

    private static Map<String, Integer> createChordTypeMap() {
        Map<String, Integer> map = new HashMap<>();
        for (int row = 0; row < CHORDS.length; row++) {
            for (int col = 0; col < NOTES.length; col++) {
                map.put(CHORDS[row][col], row);
            }
        }
        return Map.copyOf(map);
    }

    // 🔥 УНИВЕРСАЛЬНЫЙ ТРАНСПОНИРОВАТЕЛЬ — ЛЮБОЙ АККОРД!
    public static String transpose(String chord, int semitones) {
        // УНИВЕРСАЛЬНАЯ ОЧИСТКА от мусора (символы, пробелы, скобки)
        chord = chord.replaceAll("[^A-Ga-g#b/#m7susadddimAug0-9]", "")
                .replaceAll("[()\\s]", "")
                .replaceAll("/+", "/")
                .replaceAll("b{3,}", "b")
                .replaceAll("#{3,}", "#");

        if (chord.isEmpty()) {
            return "?";
        }

        if (chord.contains("/")) {
            return transposeComplexSlash(chord, semitones);
        }
        return transposeSimple(chord, semitones);
    }

    // Сложные слэш-аккорды: G7sus4/C#D, G/B/D, Cmaj7/Eb/G
    private static String transposeComplexSlash(String chord, int semitones) {
        String[] parts = chord.split("/");
        StringBuilder result = new StringBuilder();

        // Корень аккорда
        result.append(transposeSimple(parts[0], semitones));

        // Все басовые ноты
        for (int i = 1; i < parts.length; i++) {
            String bass = parts[i];
            if (bass.matches("^[A-Ga-g]#?b?$")) { // простая нота
                result.append("/").append(transposeNote(bass, semitones));
            } else {
                result.append("/").append(transposeSimple(bass, semitones));
            }
        }
        return result.toString();
    }

    // Простой аккорд
    private static String transposeSimple(String chord, int semitones) {
        Integer row = CHORD_TYPE_TO_ROW.get(chord);
        if (row != null) {
            int col = getNoteIndex(extractRootNote(chord));
            int newCol = (col + semitones + 1200) % 12;
            return CHORDS[row][newCol];
        }
        // Если нет в таблице — транспонируем только корень
        return transposeUnknownRoot(chord, semitones);
    }

    // Неизвестный аккорд: транспонируем только корень
    private static String transposeUnknownRoot(String chord, int semitones) {
        String root = extractRootNote(chord);
        int col = getNoteIndex(root);
        int newCol = (col + semitones + 1200) % 12;
        String newRoot = NOTES[newCol];
        return newRoot + chord.substring(root.length());
    }

    // Транспозиция одиночной ноты
    private static String transposeNote(String note, int semitones) {
        int col = getNoteIndex(normalizeNote(note));
        int newCol = (col + semitones + 1200) % 12;
        return NOTES[newCol];
    }

    // Извлечение корневой ноты
    private static String extractRootNote(String chord) {
        return chord.replaceAll("(?<=.)(m.*|7.*|sus.*|add.*|dim.*|aug.*|maj.*|[b#].*)", "");
    }

    // Нормализация ноты
    private static String normalizeNote(String note) {
        return note.replaceAll("[b#]{2,}", "#").replace("bb", "b").toUpperCase();
    }

    // Индекс ноты в NOTES
    private static int getNoteIndex(String note) {
        note = normalizeNote(note);
        for (int i = 0; i < NOTES.length; i++) {
            if (NOTES[i].equals(note)) {
                return i;
            }
        }
        return 0;
    }

}


 */