package ru.myguitarlib.exception;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.myguitarlib.dto.ApiResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        // Собираем ВСЕ конкретные сообщения ошибок
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();

        // Первое сообщение как основное
        String mainError = errors.isEmpty() ? "Ошибка валидации" : errors.get(0);

        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(
                        false,
                        mainError,
                        null,
                        errors
                ));
    }

//  исключение
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ApiResponse<>(
                        false,
                        ex.getMessage(),
                        null,
                        List.of(ex.getMessage())
                ));
    }

// если при сохранении юзера будет что то не так
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(
                        false,
                        "Ошибка сохранения данных",
                        null,
                        List.of("Нарушение ограничений базы данных")
                ));
    }
}
