package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.security.JwtService;
import com.motasem.safeshare.services.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** The one-time-code rules: single use, expiry, limited guesses, and a wait between new codes. */
class AuthenticationServiceOtpTest {

    private static final String EMAIL = "user@example.com";

    private UserRepository repository;
    private AuthenticationService service;
    private User user;

    @BeforeEach
    void setUp() {
        repository = mock(UserRepository.class);
        JwtService jwt = mock(JwtService.class);
        when(jwt.generateToken(any(User.class))).thenReturn("signed-token");
        service = new AuthenticationService(repository, mock(PasswordEncoder.class), jwt,
                mock(AuthenticationManager.class), mock(EmailService.class));

        user = User.builder()
                .email(EMAIL)
                .password("hash")
                .otpCode("123456")
                .otpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10))
                .build();
        when(repository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
    }

    private AuthenticationResponse verify(String code) {
        return service.verifyOtp(new VerificationRequest(EMAIL, code));
    }

    @Test
    void theRightCodeSignsTheUserInOnceOnly() {
        AuthenticationResponse response = verify("123456");

        assertEquals("signed-token", response.getToken());
        assertNull(user.getOtpCode(), "the code must be cleared after use");
        assertThrows(AuthenticationService.InvalidOtpException.class, () -> verify("123456"));
    }

    @Test
    void spacesAndDashesInTheCodeAreIgnored() {
        assertNotNull(verify("123 - 456").getToken());
    }

    @Test
    void aWrongCodeIsRejectedAndTheRemainingAttemptsAreReported() {
        AuthenticationService.InvalidOtpException error =
                assertThrows(AuthenticationService.InvalidOtpException.class, () -> verify("000000"));

        assertTrue(error.getMessage().contains("4 attempt(s) left"));
    }

    @Test
    void fiveWrongCodesBurnTheCodeEvenIfTheNextOneIsRight() {
        for (int i = 0; i < 5; i++) {
            assertThrows(AuthenticationService.InvalidOtpException.class, () -> verify("000000"));
        }
        AuthenticationService.InvalidOtpException error =
                assertThrows(AuthenticationService.InvalidOtpException.class, () -> verify("123456"));

        assertTrue(error.getMessage().contains("No active verification code"));
    }

    @Test
    void anExpiredCodeIsRejected() {
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).minusSeconds(1));

        AuthenticationService.InvalidOtpException error =
                assertThrows(AuthenticationService.InvalidOtpException.class, () -> verify("123456"));

        assertTrue(error.getMessage().contains("expired"));
        assertNull(user.getOtpCode());
    }

    @Test
    void aNewCodeCannotBeRequestedRightAfterTheLastOne() {
        // The code above was "sent" just now (expiry is 10 minutes ahead), so a resend must wait
        RuntimeException error = assertThrows(RuntimeException.class, () -> service.resendOtp(EMAIL));

        assertTrue(error.getMessage().contains("Please wait"));
        assertEquals("123456", user.getOtpCode(), "the existing code must stay untouched");
    }

    @Test
    void aNewCodeCanBeRequestedAfterTheWait() {
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10).minusSeconds(61));

        service.resendOtp(EMAIL);

        assertTrue(user.getOtpCode().matches("\\d{6}"));
        assertEquals(0, user.getOtpFailedAttempts());
    }
}
