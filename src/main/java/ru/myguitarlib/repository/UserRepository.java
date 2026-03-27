package ru.myguitarlib.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.myguitarlib.model.AnalyticsEvent;
import ru.myguitarlib.model.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Page<User> findAll(Pageable pageable);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
