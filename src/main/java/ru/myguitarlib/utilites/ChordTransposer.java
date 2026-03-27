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

            // rest = суффикс + возможный бас, например "m/C" или "maj7/E"
            String suffix = removeBass(rest);   // "m" или "maj7"
            String newBass = transposeBass(rest, semitones); // "/C" -> "/C" транспонированный

            // Правильный порядок: корень + суффикс + бас
            return newRoot + suffix + newBass;
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