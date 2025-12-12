package ru.myguitarlib.config;

import lombok.Data;
import lombok.Generated;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {
    private CookieConfig cookie = new CookieConfig();
    private JwtConfig jwt = new JwtConfig();

    @Data
    public static class CookieConfig {
        private AccessCookie access = new AccessCookie();
        private RefreshCookie refresh = new RefreshCookie();
    }

    @Data
    public static class AccessCookie {
        private boolean httpOnly;
        private boolean secure;
        private String sameSite;
        private int maxAgeSeconds;
    }

    @Data
    public static class RefreshCookie {
        private boolean httpOnly;
        private boolean secure;
        private String sameSite;
        private int maxAgeSeconds;
    }

    @Data
    public static class JwtConfig {
        private int accessTokenValiditySeconds;
        private int refreshTokenValiditySeconds;
    }
}
