package ru.myguitarlib.init;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.RoleType;
import ru.myguitarlib.model.song.Song;
import ru.myguitarlib.model.song.SongChord;
import ru.myguitarlib.repository.SongRepository;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.utilites.ChordParser;

@Component
// @Profile("dev")
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SongRepository songRepository;
    private final PasswordEncoder passwordEncoder;
    private final ChordParser chordParser;

    @Override
    @Transactional
    public void run(String... args) {

// ------- ADMIN -----------------------------
        /*
        String email_admin = "admin@admin.admin";

        if (!userRepository.existsByEmail(email_admin)) {
            User user_admin = new User();
            user_admin.setEmail(email_admin);
            user_admin.setName("Admin Admin");
            user_admin.setRole(RoleType.ADMIN);
            user_admin.setEncryptedPassword(passwordEncoder.encode("password"));
            userRepository.save(user_admin);
        }
        */

// -------------------------------------------

        String email = "test";

        if (userRepository.existsByEmail(email)) {
            return;
        }

        // Создаём тестового пользователя
        User user = new User();
        user.setEmail(email);
        user.setName("Demo User");
        user.setRole(RoleType.USER);
        user.setEncryptedPassword(passwordEncoder.encode("12345678"));
        user = userRepository.save(user);

        // Создаём демо-песни
        createDemoSongs(user);
    }

    /**
     * Создаёт демо-песни для тестового пользователя.
     * Вызывается при старте приложения и при ежедневном сбросе.
     */
    @Transactional
    public void createDemoSongs(User user) {

        Song s1 = new Song();
        s1.setOwner(user);
        s1.setArtist("! Ты автор своей песни");
        s1.setTitle("! Напиши ее сейчас");
        s1.setComment("просто попробуй написать... завтра все само удалится из тестового аккаунта");
        s1.setLyrics(
                "Напиши свой текст и аккорды прямо здесь!\n" +
                        "Нажми «Редактировать» и попробуй сам:\n" +
                        "Меняй текст, расставляй аккорды,\n" +
                        "Транспонируй в удобную тональность.\n" +
                        "Настрой скорость прокрутки и размер шрифта.\n" +
                        "Сохрани и посмотри что получилось!\n"
        );

        addChord(s1, 0, 0, "Am");
        addChord(s1, 0, 18, "Em");
        addChord(s1, 1, 0, "Dm");
        addChord(s1, 4, 0, "Dsus2");
        songRepository.save(s1);

        Song s2 = new Song();
        s2.setOwner(user);
        s2.setArtist("Кино");
        s2.setTitle("Группа крови");
        s2.setComment("Просто кусочек песни");
        s2.setLyrics(
                "Группа крови на рукаве\n" +
                        "Мой порядковый номер на рукаве\n"
        );
        addChord(s2, 0, 0, "Am");
        addChord(s2, 1, 10, "Em");
        songRepository.save(s2);

        Song s3 = new Song();
        s3.setOwner(user);
        s3.setArtist("Сплин");
        s3.setTitle("Выхода нет");
        s3.setComment("много разных аккордов");
        s3.setLyrics(
                "...Выхода нет\n" +
                        "Ключ поверни и полетели\n"
        );
        addChord(s3, 0, 0, "Am7");
        addChord(s3, 0, 8, "Cdim");
        addChord(s3, 0, 15, "Fsus2");
        addChord(s3, 0, 23, "Am/C");
        addChord(s3, 0, 31, "Dm/G");
        addChord(s3, 1, 0, "Gmadd9");
        addChord(s3, 1, 16, "Dmaj");
        addChord(s3, 1, 23, "Faug");
        songRepository.save(s3);

        String rawText = """
            Am                      E
            Ой, то не вечер, то не вечер,
            Am   G           C   G
            Мне малым-мало спалось.
                    C                G   E
            Мне малым-мало спалось
            Am          Dm    E   Am  A7
            Ой, да во сне привиделось.
                    C                G   E
            Мне малым-мало спалось
            Am          Dm    E   Am
            Ой, да во сне привиделось.
    
                    Am             E
            Мне во сне привиделось,
            Am    G            C   G
            Будто конь мой вороной
            C                 G  E
                    Разыгрался, расплясался,
            Am    Dm    E     Am  A7
            Разрезвился подо мной.
                    C                 G  E
            Разыгрался, расплясался,
                    Am    Dm    E     Am
            Разрезвился подо мной.
    
                    Am                      E
            Ой, да налетели ветры злые,
                    Am           G           C  G
            Ой, да с восточной стороны
            C                G  E
            И сорвали черну шапку
            Am   Dm     E   Am  A7
            С моей буйной головы.
            C                G  E
            И сорвали черну шапку
            Am   Dm     E   Am
            С моей буйной головы.
    
            Am         E
            А есаул догадлив был,
            Am       G            C  G
            Он смог сон мой разгадать
            C                         G    E
            "Ой, пропадет," - он говорил мне, -
                    Am  Dm    E   Am  A7
            "Твоя буйна голова".
                    C                         G    E
            "Ой, пропадет," - он говорил мне, -
                    Am  Dm    E   Am
            "Твоя буйна голова".
    
                    Am                      E
            Ой, то не вечер, то не вечер,
            Am   G           C   G
            Мне малым-мало спалось.
                    C                G   E
            Мне малым-мало спалось
            Am          Dm    E   Am  A7
            Ой, да во сне привиделось.
                    C                G   E
            Мне малым-мало спалось
            Am          Dm    E   Am
            Ой, да во сне привиделось.
          """;

        Song s4 = chordParser.parser("Народная", "Ой, то не вечер", rawText);
        s4.setOwner(user);
        s4.setComment("Песня импортирована из буфера");
        songRepository.save(s4);
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