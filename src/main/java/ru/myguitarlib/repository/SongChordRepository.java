package ru.myguitarlib.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.myguitarlib.model.SongChord;

import java.util.List;

@Repository
public interface SongChordRepository extends JpaRepository<SongChord, Long> {
}
