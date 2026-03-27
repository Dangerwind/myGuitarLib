package ru.myguitarlib.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ru.myguitarlib.dto.song.ArtistTitleDto;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.song.Song;

import java.util.List;
import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    @Query("""
        select new ru.myguitarlib.dto.song.ArtistTitleDto(s.id, s.artist, s.title, s.comment)
        from Song s
        where s.owner.id = :ownerId
          and (
               :q is null
               or :q = ''
               or lower(s.artist) like lower(concat('%', :q, '%'))
               or lower(s.title)  like lower(concat('%', :q, '%'))
          )
    """)
    List<ArtistTitleDto> findIndex(Long ownerId, String q, Sort sort);

    @Query("""
        select distinct s from Song s
        left join fetch s.chords
        where s.id = :id and s.owner.id = :ownerId
    """)
    Optional<Song> findByIdAndOwnerIdWithChords(Long id, Long ownerId);

    Optional<Song> findByIdAndOwnerId(Long songId, Long ownerId);

    @Query("""
        select s from Song s
        where s.owner.id = :ownerId
    """)
    Page<Song> findByOwnerId(@org.springframework.data.repository.query.Param("ownerId") Long ownerId, Pageable pageable);

    @Query("select s from Song s")
    Page<Song> findAllSongs(Pageable pageable);

    Long countByOwnerId(Long ownerId);

    void deleteByOwnerId(Long ownerId);

    void deleteAllByOwner(User testUser);
}