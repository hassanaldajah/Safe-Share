package com.motasem.safeshare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caps the endpoints that send e-mails to new addresses (sign-up and forgot-password),
 * so nobody can burn the project's Gmail sending quota and stop OTPs reaching real users.
 * The limit is generous on purpose: a normal user never gets near it.
 * Per-account abuse is already handled by the login lockout and the OTP attempt/resend limits.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MILLIS = 10 * 60 * 1000L;
    private static final int MAX_TRACKED_CLIENTS = 10_000;
    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password"
    );

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !LIMITED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        if (hits.size() > MAX_TRACKED_CLIENTS) {
            prune(now);
        }

        String key = clientIp(request) + " " + request.getRequestURI();
        Deque<Long> times = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        long retryAfterSeconds = 0;
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() > WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_REQUESTS) {
                retryAfterSeconds = (WINDOW_MILLIS - (now - times.peekFirst())) / 1000 + 1;
            } else {
                times.addLast(now);
            }
        }

        if (retryAfterSeconds > 0) {
            long minutes = (retryAfterSeconds + 59) / 60;
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("Too many requests. Please try again in " + minutes + " minute(s).");
            return;
        }
        chain.doFilter(request, response);
    }

    /**
     * The client address. X-Forwarded-For is only trusted when the request comes from a
     * private-network proxy (nginx, the Vite dev server), and only its last value, because the client controls the rest.
     */
    private String clientIp(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank() && isLocalProxy(remote)) {
            String[] chain = forwarded.split(",");
            return chain[chain.length - 1].trim();   // appended by our proxy; earlier values can be forged by the client
        }
        return remote;
    }

    private boolean isLocalProxy(String ip) {
        try {
            InetAddress address = InetAddress.getByName(ip); // IP literal, no DNS lookup
            return address.isLoopbackAddress() || address.isSiteLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }

    private void prune(long now) {
        hits.entrySet().removeIf(entry -> {
            Deque<Long> times = entry.getValue();
            synchronized (times) {
                return times.isEmpty() || now - times.peekLast() > WINDOW_MILLIS;
            }
        });
    }
}
