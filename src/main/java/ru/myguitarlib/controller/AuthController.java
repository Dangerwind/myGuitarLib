package ru.myguitarlib.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.myguitarlib.config.SecurityProperties;
import ru.myguitarlib.dto.ApiResponse;
import ru.myguitarlib.dto.LoginDto;
import ru.myguitarlib.dto.UserCreateDto;
import ru.myguitarlib.dto.UserDto;
import ru.myguitarlib.exception.ApiException;
import ru.myguitarlib.model.User;
import ru.myguitarlib.model.enums.EventType;
import ru.myguitarlib.model.enums.RoleType;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.security.TokenCookieService;
import ru.myguitarlib.service.AnalyticsService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final BCryptPasswordEncoder encoder;
    private final JwtEncoder jwtEncoder;
    private final TokenCookieService tokenCookieService;
    private final SecurityProperties securityProperties;
    private final AnalyticsService analyticsService;


    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserCreateDto>> register(
            @RequestBody @Valid UserDto userDto,
            HttpServletRequest request) {

        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new ApiException("USER_EMAIL_EXISTS", "Email уже занят", HttpStatus.CONFLICT);
        }

        var userToSave = new User();
        userToSave.setEmail(userDto.getEmail());
        userToSave.setName(userDto.getName());
        userToSave.setRole(RoleType.USER);
        userToSave.setEncryptedPassword(encoder.encode(userDto.getPassword()));
        var crUser = userRepository.save(userToSave);

        // Записываем событие регистрации
        analyticsService.track(crUser, EventType.USER_REGISTRATION, crUser.getEmail(), request);

        var createdUserDto = new UserCreateDto();
        createdUserDto.setId(crUser.getId());
        createdUserDto.setName(crUser.getName());
        createdUserDto.setEmail(crUser.getEmail());
        createdUserDto.setCreatedAt(LocalDateTime.now());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>(
                        true,
                        "Регистрация успешна",
                        createdUserDto,
                        Collections.emptyList()
                ));
    }


    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody @Valid LoginDto loginDto,
            HttpServletResponse response,
            HttpServletRequest request) {

        // 1. Аутентификация
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword())
        );

        // 2. Наш User
        User user = (User) authentication.getPrincipal();

        // 3. TTL токенов
        int accessTtl  = securityProperties.getJwt().getAccessTokenValiditySeconds();
        int refreshTtl = securityProperties.getJwt().getRefreshTokenValiditySeconds();

        // 4. Генерация токенов
        String accessToken  = generateToken(user, authentication.getAuthorities(), accessTtl);
        String refreshToken = generateToken(user, authentication.getAuthorities(), refreshTtl);

        // 5. Куки
        var cookies = tokenCookieService.buildCookies(accessToken, refreshToken);
        response.addHeader("Set-Cookie", cookies.access().toString());
        response.addHeader("Set-Cookie", cookies.refresh().toString());

        // 6. Записываем событие входа
        analyticsService.track(user, EventType.USER_LOGIN, user.getEmail(), request);

        // 7. Возвращаем роль и email — нужно фронтенду для AdminRoute
        String role = user.getRole() != null ? user.getRole().name() : RoleType.USER.name();
        Map<String, Object> data = Map.of(
                "role",  role,
                "email", user.getEmail(),
                "name",  user.getName() != null ? user.getName() : ""
        );

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Успешный вход", data, Collections.emptyList())
        );
    }


    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletResponse response,
            HttpServletRequest request) {

        // Записываем событие выхода пока JWT ещё валиден
        if (jwt != null) {
            String email = jwt.getSubject();
            userRepository.findByEmail(email)
                    .ifPresent(user -> analyticsService.track(user, EventType.USER_LOGOUT, email, request));
        }

        var cookies = tokenCookieService.buildCookies("", "");
        response.addHeader("Set-Cookie", expireCookie(cookies.access().toString()));
        response.addHeader("Set-Cookie", expireCookie(cookies.refresh().toString()));

        return ResponseEntity.ok(
                new ApiResponse<>(true, "Выход выполнен", null, List.of())
        );
    }


    // ─── Вспомогательные ─────────────────────────────────────────────────────

    private String expireCookie(String cookie) {
        if (cookie.contains("Max-Age=")) {
            return cookie.replaceAll("Max-Age=\\d+", "Max-Age=0");
        }
        return cookie + "; Max-Age=0";
    }

    private String generateToken(User user,
                                 Iterable<? extends GrantedAuthority> authorities,
                                 int ttlSeconds) {
        Instant now       = Instant.now();
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

    /**
     * Проверка залогиненности. Доступен без авторизации.
     * Если куки с токеном валидны — возвращает данные пользователя (success: true).
     * Если нет — возвращает success: false (НЕ 401, чтобы не триггерить 401-редирект).
     * Используется SharedSongPage для определения состояния авторизации.
     */

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me(
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (jwt == null) {
            return ResponseEntity.ok(new ApiResponse<>(false, "Not authenticated", null, List.of()));
        }

        String email = jwt.getSubject();
        String name  = jwt.getClaimAsString("name");
        String role  = jwt.getClaimAsString("roles");
        if (role == null) role = "USER";
        role = role.replace("ROLE_", "");

        Map<String, Object> data = new HashMap<>();
        data.put("email", email);
        data.put("name",  name != null ? name : "");
        data.put("role",  role);

        return ResponseEntity.ok(new ApiResponse<>(true, "Authenticated", data, List.of()));
    }

}
