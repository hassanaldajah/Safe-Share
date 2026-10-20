package com.motasem.safeshare.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRateLimitFilterTest {

    private static final String FORGOT = "/api/v1/auth/forgot-password";

    private final AuthRateLimitFilter filter = new AuthRateLimitFilter();

    private MockHttpServletResponse send(String method, String path, String remoteAddr, String forwardedFor) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRequestURI(path);
        request.setRemoteAddr(remoteAddr);
        if (forwardedFor != null) {
            request.addHeader("X-Forwarded-For", forwardedFor);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void blocksTheEleventhRequestFromOneVisitor() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertEquals(200, send("POST", FORGOT, "203.0.113.5", null).getStatus());
        }
        MockHttpServletResponse blocked = send("POST", FORGOT, "203.0.113.5", null);

        assertEquals(429, blocked.getStatus());
        assertTrue(blocked.getContentAsString().contains("Too many requests"));
        assertTrue(Long.parseLong(blocked.getHeader("Retry-After")) > 0);
    }

    @Test
    void otherVisitorsAreNotAffected() throws Exception {
        for (int i = 0; i < 11; i++) {
            send("POST", FORGOT, "203.0.113.5", null);
        }
        assertEquals(200, send("POST", FORGOT, "203.0.113.6", null).getStatus());
    }

    @Test
    void signInAndOtherEndpointsAreNotLimitedByThisFilter() throws Exception {
        for (int i = 0; i < 30; i++) {
            assertEquals(200, send("POST", "/api/v1/auth/authenticate", "203.0.113.5", null).getStatus());
            assertEquals(200, send("GET", FORGOT, "203.0.113.5", null).getStatus());
        }
    }

    @Test
    void aForgedForwardedForHeaderCannotDodgeTheLimit() throws Exception {
        // The request comes through our own proxy (a private address), which appends the real client last.
        // The client controls everything before it, so only the last value may be trusted.
        for (int i = 0; i < 10; i++) {
            assertEquals(200, send("POST", FORGOT, "172.18.0.5", "1.1.1." + i + ", 203.0.113.9").getStatus());
        }
        assertEquals(429, send("POST", FORGOT, "172.18.0.5", "9.9.9.9, 203.0.113.9").getStatus());
    }

    @Test
    void forwardedForFromAPublicAddressIsIgnored() throws Exception {
        // Someone connecting directly cannot choose their own identity
        for (int i = 0; i < 10; i++) {
            send("POST", FORGOT, "203.0.113.5", "8.8.8." + i);
        }
        assertEquals(429, send("POST", FORGOT, "203.0.113.5", "8.8.8.99").getStatus());
    }
}
