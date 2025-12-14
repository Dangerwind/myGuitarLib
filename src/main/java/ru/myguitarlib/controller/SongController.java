package ru.myguitarlib.controller;

import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.myguitarlib.model.User;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/song")
public class SongController {

    @GetMapping("/{id}")
    public String getSong(@PathVariable Long id, Authentication auth) {
        Long userId = ((User) auth.getPrincipal()).getId();
        return "123";
    }
}
