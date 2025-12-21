package ru.myguitarlib.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import ru.myguitarlib.config.SecurityProperties;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.model.User;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.security.TokenCookieService;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class TokenRefreshController {

    private final JwtDecoder jwtDecoder;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final TokenCookieService tokenCookieService;
    private final SecurityProperties securityProperties;

    // имя refresh-куки — такое же, как ты используешь в TokenCookieService
    private static final String REFRESH_COOKIE_NAME = "refresh_token";


    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        // 1. Достаём refresh-токен из куки
        String refreshToken = extractCookie(request, REFRESH_COOKIE_NAME);
        if (refreshToken == null || refreshToken.isBlank()) {
            return unauthorized("Отсутствует refresh токен");
        }

        // 2. Валидируем JWT refresh-токен
        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(refreshToken);
        } catch (JwtException e) {
            return unauthorized("Некорректный или просроченный refresh токен");
        }

        // 3. Достаём email из subject
        String email = jwt.getSubject();
        if (email == null || email.isBlank()) {
            return unauthorized("Некорректный subject в токене");
        }

        // 4. Находим пользователя
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // 5. Достаём роли (если хранишь в токене — можно взять из claim "roles")
        List<String> roles = jwt.<List<String>>getClaim("roles");
        if (roles == null) {
            roles = List.of();
        }
        List<GrantedAuthority> authorities = roles.stream()
                .map(r -> (GrantedAuthority) () -> r)
                .toList();

        // 6. TTL берём из настроек
        int accessTtl = securityProperties.getJwt().getAccessTokenValiditySeconds();
        int refreshTtl = securityProperties.getJwt().getRefreshTokenValiditySeconds();

        // 7. Генерим новые токены
        String newAccessToken = generateToken(user, authorities, accessTtl);
        String newRefreshToken = generateToken(user, authorities, refreshTtl);

        // 8. Собираем новые куки
        var cookies = tokenCookieService.buildCookies(newAccessToken, newRefreshToken);
        response.addHeader("Set-Cookie", cookies.access());
        response.addHeader("Set-Cookie", cookies.refresh());

        ApiResponse<Void> body = new ApiResponse<>(
                true,
                "Токены обновлены",
                null,
                Collections.emptyList()
        );
        return ResponseEntity.ok(body);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        var cookies = request.getCookies();
        if (cookies == null) return null;
        for (var c : cookies) {
            if (name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }

    private ResponseEntity<ApiResponse<Void>> unauthorized(String message) {
        ApiResponse<Void> body = new ApiResponse<>(
                false,
                message,
                null,
                List.of(message)
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    private String generateToken(User user,
                                 Iterable<? extends GrantedAuthority> authorities,
                                 int ttlSeconds) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(ttlSeconds);

        List<String> roles = authorities == null
                ? List.of()
                : ((List<? extends GrantedAuthority>) authorities).stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("myguitarlib")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getEmail())
                .claim("roles", roles)
                .build();

        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
