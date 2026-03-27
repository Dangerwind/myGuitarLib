package ru.myguitarlib.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Генерирует и верифицирует защищённые токены для публичных ссылок на песни.
 *
 * Формат токена: {songId}.{base64url(HMAC-SHA256(songId, secret))}
 * Токен нельзя подделать без знания секрета.
 */
@Service
public class ShareTokenService {

    private static final String HMAC_ALGO = "HmacSHA256";

    @Value("${app.share-secret}")
    private String shareSecret;

    /**
     * Генерирует токен для указанного id песни.
     * Пример: "42.xK8mN3pQ..."
     */
    public String generateToken(Long songId) {
        String signature = sign(songId.toString());
        return songId + "." + signature;
    }

    /**
     * Валидирует токен и возвращает id песни.
     * @throws IllegalArgumentException если токен неверный или подделан
     */
    public Long validateToken(String token) {
        if (token == null || !token.contains(".")) {
            throw new IllegalArgumentException("Invalid share token format");
        }
        int dotIdx = token.indexOf('.');
        String idPart  = token.substring(0, dotIdx);
        String sigPart = token.substring(dotIdx + 1);

        long songId;
        try {
            songId = Long.parseLong(idPart);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid song id in token");
        }

        String expectedSig = sign(idPart);
        // Безопасное сравнение (защита от timing-attack)
        if (!constantTimeEquals(expectedSig, sigPart)) {
            throw new IllegalArgumentException("Share token signature mismatch");
        }
        return songId;
    }

    // ── private ──────────────────────────────────────────────────────────────

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(shareSecret.getBytes(), HMAC_ALGO));
            byte[] raw = mac.doFinal(data.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign share token", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }
}
