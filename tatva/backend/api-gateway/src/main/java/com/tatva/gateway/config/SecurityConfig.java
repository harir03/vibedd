package com.tatva.gateway.config;

import com.tatva.gateway.security.JwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;

import java.util.List;

/**
 * Security configuration for TATVA API Gateway.
 * <ul>
 *   <li>Stateless JWT authentication (RS256)</li>
 *   <li>RBAC: ADMIN-only routes, ANALYST+ routes, public routes</li>
 *   <li>CORS with strict origin whitelist</li>
 *   <li>CSRF disabled (stateless API)</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints — no auth required
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/status").permitAll()
                        .requestMatchers("/health").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ADMIN-only endpoints
                        .requestMatchers("/api/v1/ingestion/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/audit/**").hasRole("ADMIN")

                        // ANALYST+ endpoints (ANALYST and ADMIN can access)
                        .requestMatchers("/api/v1/graph/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/entities/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/relationships/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/search/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/analytics/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/trends/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/alerts/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/watchlist/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/nlp/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/reasoning/**").hasAnyRole("ANALYST", "ADMIN")
                        .requestMatchers("/api/v1/query/**").hasAnyRole("ANALYST", "ADMIN")

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                                    HttpStatus.UNAUTHORIZED, "Authentication required");
                            problem.setTitle("Unauthorized");
                            problem.setType(URI.create("about:blank"));
                            new ObjectMapper().writeValue(response.getOutputStream(), problem);
                        })
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:8080"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID"));
        config.setExposedHeaders(List.of("X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
