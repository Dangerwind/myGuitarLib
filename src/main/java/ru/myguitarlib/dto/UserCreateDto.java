package ru.myguitarlib.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserCreateDto {

    private Long id;

    private String email;

    private String name;

    private LocalDateTime createdAt;
}
