package ru.myguitarlib.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.model.PasswordResetToken;
import ru.myguitarlib.model.User;
import ru.myguitarlib.repository.PasswordResetTokenRepository;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.service.EmailService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // ─── DTO ──────────────────────────────────────────────────────────────────

    @Data
    public static class ForgotPasswordRequest {
        @Email @NotBlank
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;
        @NotBlank @Size(min = 6)
        private String newPassword;
    }

    // ─── POST /forgot-password ────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @RequestBody @Valid ForgotPasswordRequest req) {

        // Всегда возвращаем успех — не раскрываем существует ли email
        userRepository.findByEmail(req.getEmail()).ifPresent(user -> {
            // Удаляем старые токены пользователя
            tokenRepository.deleteAllByUser(user);

            // Создаём новый токен
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(UUID.randomUUID().toString());
            resetToken.setUser(user);
            resetToken.setExpiresAt(LocalDateTime.now().plusHours(1));
            tokenRepository.save(resetToken);

            // Отправляем письмо
            String link = "https://myguitarlib.ru/reset-password?token=" + resetToken.getToken();
            emailService.sendPasswordResetEmail(user.getEmail(), link);
        });

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Если аккаунт с таким email существует — письмо отправлено",
                null,
                Collections.emptyList()
        ));
    }

    // ─── POST /reset-password ─────────────────────────────────────────────────

    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestBody @Valid ResetPasswordRequest req) {

        PasswordResetToken resetToken = tokenRepository.findByToken(req.getToken())
                .orElse(null);

        if (resetToken == null || resetToken.isExpired() || resetToken.isUsed()) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                    false,
                    "Ссылка недействительна или истекла. Запроси новую.",
                    null,
                    Collections.emptyList()
            ));
        }

        // Меняем пароль
        User user = resetToken.getUser();
        user.setEncryptedPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);

        // Помечаем токен как использованный
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Пароль успешно изменён. Теперь можешь войти.",
                null,
                Collections.emptyList()
        ));
    }
}
