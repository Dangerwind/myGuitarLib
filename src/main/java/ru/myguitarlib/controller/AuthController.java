package ru.myguitarlib.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
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
import ru.myguitarlib.model.enums.RoleType;
import ru.myguitarlib.repository.UserRepository;
import ru.myguitarlib.security.TokenCookieService;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

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


    @PostMapping(path = "/register")
    public ResponseEntity<ApiResponse<UserCreateDto>> register(@RequestBody @Valid UserDto userDto) {

        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new ApiException("USER_EMAIL_EXISTS", "Email уже занят", HttpStatus.CONFLICT);
        }

        var userToSave = new User();
        userToSave.setEmail(userDto.getEmail());
        userToSave.setName(userDto.getName());
        userToSave.setRole(RoleType.USER);
        userToSave.setEncryptedPassword(encoder.encode(userDto.getPassword()));

        var crUser = userRepository.save(userToSave);

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
                        java.util.Collections.emptyList()
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(@RequestBody @Valid LoginDto loginDto,
                                                   HttpServletResponse response) {

        // 1. Аутентификация по email + password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDto.getEmail(),
                        loginDto.getPassword()
                )
        );

        // 2. Наш User (реализует UserDetails)
        User user = (User) authentication.getPrincipal();

        // 3. TTL токенов из application.yml (app.security.jwt.*)
        int accessTtl = securityProperties.getJwt().getAccessTokenValiditySeconds();
        int refreshTtl = securityProperties.getJwt().getRefreshTokenValiditySeconds();

        // 4. Генерация токенов
        String accessToken = generateToken(user, authentication.getAuthorities(), accessTtl);
        String refreshToken = generateToken(user, authentication.getAuthorities(), refreshTtl);

        // 5. Куки строятся через TokenCookieService (читает app.security.cookie.*)
        var cookies = tokenCookieService.buildCookies(accessToken, refreshToken);

        response.addHeader("Set-Cookie", cookies.access().toString());
        response.addHeader("Set-Cookie", cookies.refresh().toString());

        // 6. Ответ
        ApiResponse<Void> body = new ApiResponse<>(
                true,
                "Успешный вход",
                null,
                Collections.emptyList()
        );
        return ResponseEntity.ok(body);
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
