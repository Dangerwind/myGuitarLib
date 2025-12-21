package ru.myguitarlib.security;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ru.myguitarlib.config.SecurityProperties;

@Service
@RequiredArgsConstructor
public class TokenCookieService {

    private final SecurityProperties securityProperties;

    public record TokenCookies(String access, String refresh) {}

    public TokenCookies buildCookies(String accessToken, String refreshToken) {
        var cookieProps = securityProperties.getCookie();
        var accessCfg = cookieProps.getAccess();
        var refreshCfg = cookieProps.getRefresh();

        String accessCookie = buildCookieString(
                "access_token",
                accessToken,
                accessCfg.isHttpOnly(),
                accessCfg.isSecure(),
                accessCfg.getSameSite(),
                accessCfg.getMaxAgeSeconds()
        );

        String refreshCookie = buildCookieString(
                "refresh_token",
                refreshToken,
                refreshCfg.isHttpOnly(),
                refreshCfg.isSecure(),
                refreshCfg.getSameSite(),
                refreshCfg.getMaxAgeSeconds()
        );

        return new TokenCookies(accessCookie, refreshCookie);
    }

    private String buildCookieString(String name,
                                     String value,
                                     boolean httpOnly,
                                     boolean secure,
                                     String sameSite,
                                     int maxAgeSeconds) {

        StringBuilder sb = new StringBuilder();
        sb.append(name).append("=").append(value == null ? "" : value).append("; Path=/; ");

        if (maxAgeSeconds > 0) {
            sb.append("Max-Age=").append(maxAgeSeconds).append("; ");
        }

        if (secure) {
            sb.append("Secure; ");
        }
        if (httpOnly) {
            sb.append("HttpOnly; ");
        }
        if (sameSite != null && !sameSite.isBlank()) {
            sb.append("SameSite=").append(sameSite).append("; ");
        }

        return sb.toString().trim();
    }
}
