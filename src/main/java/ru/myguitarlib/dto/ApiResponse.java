package ru.myguitarlib.dto;

public record ApiResponse<T>(
        boolean success,
        String message,
        T data,
        java.util.List<String> errors
) {}