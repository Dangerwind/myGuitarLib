package ru.myguitarlib.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import ru.myguitarlib.repository.UserRepository;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtDecoder jwtDecoder;          // декодирует JWT (для проверок)
    private final UserRepository userRepository;  // ищем пользователя по email
    private final PasswordEncoder passwordEncoder;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Отключаем CSRF, потому что у нас чистый REST (нет форм, нет сессий)
                .csrf(csrf -> csrf.disable())

                // 2. Описываем, какие запросы можно без логина, а какие только с JWT
                .authorizeHttpRequests(auth -> auth
                        // login, register, refresh — доступны всем
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Swagger / OpenAPI — тоже публично
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // всё остальное — только для аутентифицированных
                        .anyRequest().authenticated()
                )

                // 3. Говорим: мы не используем серверные сессии, только JWT → статeless
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 4. Включаем JWT-ресурс-сервер, но токен берём НЕ из заголовка, а из cookie
                .oauth2ResourceServer(rs -> rs
                        .bearerTokenResolver(cookieTokenResolver())   // достаём access_token из куки
                        .jwt(jwt -> jwt.decoder(jwtDecoder))          // как проверять подпись/срок токена
                );

        return http.build();
    }

    // === Достаём access_token из HttpOnly cookie ===
    @Bean
    BearerTokenResolver cookieTokenResolver() {
        return request -> getCookieValue(request, "access_token");
    }

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }

    // === Говорим Spring Security, как находить пользователя по email (username) ===
    @Bean
    UserDetailsService userDetailsService() {
        // username в Security = email в нашей БД
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // === AuthenticationManager, который проверяет логин/пароль ===
    @Bean
    AuthenticationManager authenticationManager(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService); // где брать пользователя
        provider.setPasswordEncoder(passwordEncoder);       // как проверять пароль (BCrypt)
        return new ProviderManager(provider);               // AuthenticationManager c одним провайдером
    }
}