package com.motasem.safeshare.controller;

import lombok.extern.slf4j.Slf4j;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.security.JwtService;
import com.motasem.safeshare.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private static final int    MAX_FAILED_ATTEMPTS    = 5;
    private static final long   LOCK_DURATION_MINUTES  = 15;

    private static final int    MAX_OTP_ATTEMPTS       = 5;   // wrong guesses before the code is burned
    private static final long   OTP_VALID_MINUTES      = 10;
    private static final long   OTP_RESEND_WAIT_SECONDS = 60; // stops resend from being used to spam or reroll codes

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Wrong or expired OTP. Kept out of rollback so the attempt counter is saved. */
    public static class InvalidOtpException extends RuntimeException {
        public InvalidOtpException(String message) { super(message); }
    }

    // 6-digit code from a cryptographically secure generator
    private String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }

    /** Gives the user a fresh code and resets the wrong-guess counter. Returns the code to e-mail. */
    private String issueOtp(User user) {
        String otpCode = generateOtp();
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(OTP_VALID_MINUTES));
        user.setOtpFailedAttempts(0);
        return otpCode;
    }

    /** Refuses a new code if the current one was sent less than OTP_RESEND_WAIT_SECONDS ago. */
    private void enforceResendWait(User user) {
        if (user.getOtpExpiry() == null) return;
        LocalDateTime sentAt = user.getOtpExpiry().minusMinutes(OTP_VALID_MINUTES);
        LocalDateTime allowedAt = sentAt.plusSeconds(OTP_RESEND_WAIT_SECONDS);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (now.isBefore(allowedAt)) {
            long seconds = java.time.Duration.between(now, allowedAt).getSeconds() + 1;
            throw new RuntimeException("Please wait " + seconds + " seconds before requesting a new code.");
        }
    }

    /**
     * Checks a submitted OTP. Wrong guesses are counted, and after MAX_OTP_ATTEMPTS the code
     * is burned so a 6-digit code cannot be brute-forced. On success the code is cleared.
     */
    private void checkOtp(User user, String rawCode) {
        String code = rawCode != null ? rawCode.replaceAll("[\\s\\-,]", "") : "";

        if (user.getOtpCode() == null) {
            throw new InvalidOtpException("No active verification code. Please request a new one.");
        }
        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpFailedAttempts(0);
            repository.saveAndFlush(user);
            throw new InvalidOtpException("Verification code has expired. Please request a new one.");
        }

        boolean matches = MessageDigest.isEqual(
                user.getOtpCode().getBytes(StandardCharsets.UTF_8),
                code.getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            int attempts = (user.getOtpFailedAttempts() == null ? 0 : user.getOtpFailedAttempts()) + 1;
            if (attempts >= MAX_OTP_ATTEMPTS) {
                // Burn the code but keep the expiry, so the resend wait still applies
                // and an attacker cannot instantly roll a new code for 5 more guesses.
                user.setOtpCode(null);
                user.setOtpFailedAttempts(0);
                repository.saveAndFlush(user);
                throw new InvalidOtpException("Too many wrong codes. Please request a new one.");
            }
            user.setOtpFailedAttempts(attempts);
            repository.saveAndFlush(user);
            throw new InvalidOtpException("Invalid verification code. "
                    + (MAX_OTP_ATTEMPTS - attempts) + " attempt(s) left.");
        }

        // Single use
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpFailedAttempts(0);
    }

    // --- REGISTRATION FLOW ---
    public String register(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("A user with this email is already registered.");
        }

        String uniqueTag = "@" + request.getFullName().replaceAll("\\s+", "").toLowerCase() +
                "_" + UUID.randomUUID().toString().substring(0, 5);

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .searchTag(uniqueTag)
                .publicKey(request.getPublicKey())
                .encryptedPrivateKey(request.getEncryptedPrivateKey())
                .keySalt(request.getKeySalt())
                .keyIv(request.getKeyIv())
                .build();
        String otpCode = issueOtp(user);

        repository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otpCode);

        return "Account created successfully. Please verify your email.";
    }

    public void authenticate(AuthenticationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // ── LOCKOUT CHECK ─────────────────────────────────────────────────────
        if (!user.isAccountNonLocked()) {
            LocalDateTime unlockAt = user.getLockTime().plusMinutes(LOCK_DURATION_MINUTES);
            if (LocalDateTime.now(ZoneOffset.UTC).isBefore(unlockAt)) {
                // Still within the lockout window — reject immediately
                long minutesLeft = java.time.Duration
                        .between(LocalDateTime.now(ZoneOffset.UTC), unlockAt)
                        .toMinutes() + 1;
                throw new LockedException(
                        "Account is temporarily locked due to too many failed attempts. "
                        + "Please try again in " + minutesLeft + " minute(s)."
                );
            }
            // Lockout period has expired — auto-unlock and continue
            user.setAccountNonLocked(true);
            user.setFailedAttemptCount(0);
            user.setLockTime(null);
        }

        // ── PASSWORD VERIFICATION ────────────────────────────────────────────
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getFailedAttemptCount() + 1;
            user.setFailedAttemptCount(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setAccountNonLocked(false);
                user.setLockTime(LocalDateTime.now(ZoneOffset.UTC));
                repository.saveAndFlush(user);
                throw new LockedException(
                        "Account locked after " + MAX_FAILED_ATTEMPTS + " failed attempts. "
                        + "Try again in " + LOCK_DURATION_MINUTES + " minutes."
                );
            }

            repository.saveAndFlush(user);
            int remaining = MAX_FAILED_ATTEMPTS - attempts;
            throw new BadCredentialsException(
                    "Invalid email or password. "
                    + remaining + " attempt(s) remaining before lockout."
            );
        }

        // ── SUCCESS: reset counter ──────────────────────────────────────────────
        if (user.getFailedAttemptCount() > 0) {
            user.setFailedAttemptCount(0);
        }

        String otpCode = issueOtp(user);
        repository.saveAndFlush(user);

        try {
            emailService.sendOtpEmail(user.getEmail(), otpCode);
        } catch (RuntimeException ex) {
            log.warn("Failed to send OTP email: {}", ex.getMessage());
        }
    }

    public void generatePasswordResetOtp(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("If that email exists, a recovery code has been sent."));
        // Security best practice: Don't reveal if an email exists to prevent user enumeration!

        enforceResendWait(user);
        String otpCode = issueOtp(user);
        repository.save(user);

        // You can reuse your existing email service here, or create a specific "sendPasswordResetEmail" method
        emailService.sendOtpEmail(user.getEmail(), otpCode);
    }

    @Transactional(noRollbackFor = InvalidOtpException.class)
    public void resetPassword(ResetPasswordRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Check the code (counts wrong guesses, rejects expired codes, single use)
        checkOtp(user, request.getOtpCode());

        // 2. Update the password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        repository.saveAndFlush(user);
    }
    public void resendOtp(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        enforceResendWait(user);
        String newOtpCode = issueOtp(user);
        repository.save(user);

        emailService.sendOtpEmail(user.getEmail(), newOtpCode);
    }

    // --- VERIFICATION FLOW ---
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public AuthenticationResponse verifyOtp(VerificationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Counts wrong guesses, rejects expired codes, and clears the code on success
        checkOtp(user, request.getCode());

        repository.save(user);

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .publicKey(user.getPublicKey())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .keyIv(user.getKeyIv())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .searchTag(user.getSearchTag())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }
}