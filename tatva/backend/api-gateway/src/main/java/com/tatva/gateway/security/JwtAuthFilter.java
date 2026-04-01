package com.tatva.gateway.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT authentication filter. Extracts Bearer token from Authorization header,
 * validates it, and sets the SecurityContext with the user's role as authority.
 * Only accepts "access" type tokens (not refresh tokens).
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            Claims claims = jwtTokenProvider.validateToken(token);
            if (claims != null) {
                String tokenType = claims.get("type", String.class);
                if (!"access".equals(tokenType)) {
                    log.debug("Rejected non-access token type: {}", tokenType);
                    filterChain.doFilter(request, response);
                    return;
                }

                String userId = claims.getSubject();
                String username = claims.get("username", String.class);
                String role = claims.get("role", String.class);
                Integer clearance = claims.get("clearance", Integer.class);

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                );

                var authentication = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities
                );
                authentication.setDetails(new JwtUserDetails(userId, username, role, clearance != null ? clearance : 0));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authenticated user: {} (role: {}, clearance: {})", username, role, clearance);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTHORIZATION_HEADER);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
