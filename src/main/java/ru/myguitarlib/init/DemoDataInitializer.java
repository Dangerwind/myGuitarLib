package ru.myguitarlib.init;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.RoleType;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.model.song.SongChord;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String email = "123@123.com";

        if (userRepository.existsByEmail(email)) {
            return;
        }

        // Пользователь
        User user = new User();
        user.setEmail(email);
        user.setName("Demo User");
        user.setRole(RoleType.USER);
        user.setEncryptedPassword(passwordEncoder.encode("123123123"));
        user = userRepository.save(user);

        // Песня 1
        Song s1 = new Song();
        s1.setOwner(user);
        s1.setArtist("ДДТ");
        s1.setTitle("Что такое осень");
        s1.setComment("demo");
        s1.setLyrics("""
                Что такое осень — это небо
                Плачущее небо под ногами
                """);
        addChord(s1, 0, 0, "Am");
        addChord(s1, 0, 18, "F");
        addChord(s1, 1, 0, "Dm");
        songRepository.save(s1);

        // Песня 2
        Song s2 = new Song();
        s2.setOwner(user);
        s2.setArtist("Кино");
        s2.setTitle("Группа крови");
        s2.setComment("demo");
        s2.setLyrics("""
                Группа крови на рукаве
                Мой порядковый номер на рукаве
                """);
        addChord(s2, 0, 0, "Em");
        addChord(s2, 0, 15, "C");
        addChord(s2, 1, 0, "G");
        songRepository.save(s2);

        // Песня 3
        Song s3 = new Song();
        s3.setOwner(user);
        s3.setArtist("Сплин");
        s3.setTitle("Выхода нет");
        s3.setComment("demo");
        s3.setLyrics("""
                Выхода нет
                Ключ поверни и полетели
                """);
        addChord(s3, 0, 0, "Am");
        addChord(s3, 1, 0, "F");
        addChord(s3, 1, 16, "G");
        songRepository.save(s3);
    }

    private void addChord(Song song, int lineIndex, int charIndex, String chord) {
        SongChord sc = new SongChord();
        sc.setSong(song);
        sc.setLineIndex(lineIndex);
        sc.setCharIndex(charIndex);
        sc.setChord(chord);
        song.getChords().add(sc);
    }
}
