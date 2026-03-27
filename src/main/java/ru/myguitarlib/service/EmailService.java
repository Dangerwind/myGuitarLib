package ru.myguitarlib.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@myguitarlib.ru");
            message.setTo(toEmail);
            message.setSubject("Сброс пароля — MyGuitarLib");
            message.setText(
                "Привет!\n\n" +
                "Ты запросил сброс пароля для аккаунта MyGuitarLib.\n\n" +
                "Перейди по ссылке чтобы задать новый пароль:\n" +
                resetLink + "\n\n" +
                "Ссылка действительна 1 час.\n\n" +
                "Если ты не запрашивал сброс пароля — просто проигнорируй это письмо.\n\n" +
                "MyGuitarLib"
            );
            mailSender.send(message);
        } catch (Exception e) {
            // Логируем но не бросаем — чтобы не раскрывать существование email
        }
    }
}
