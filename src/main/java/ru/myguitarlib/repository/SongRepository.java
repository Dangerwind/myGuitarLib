package ru.myguitarlib.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.myguitarlib.model.Song;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
}
