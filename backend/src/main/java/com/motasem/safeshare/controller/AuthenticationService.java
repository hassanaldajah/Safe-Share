package com.motasem.safeshare.controller;

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
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

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

    // Helper method to generate a 6-digit random number
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // --- REGISTRATION FLOW ---
    public AuthenticationResponse register(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("A user with this email is already registered.");
        }

        String uniqueTag = "@" + request.getFullName().replaceAll("\\s+", "").toLowerCase() +
                "_" + UUID.randomUUID().toString().substring(0, 5);

        String otpCode = generateOtp();

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .searchTag(uniqueTag)
                .publicKey(request.getPublicKey())
                .encryptedPrivateKey(request.getEncryptedPrivateKey())
                .keySalt(request.getKeySalt())
                .keyIv(request.getKeyIv())
                .otpCode(otpCode)
                .otpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10))
                .build();

        repository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otpCode);

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .publicKey(user.getPublicKey())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .keyIv(user.getKeyIv())
                .fullName(user.getFullName())      // <-- ADDED HERE
                .email(user.getEmail())            // <-- ADDED HERE
                .searchTag(user.getSearchTag())    // <-- ADDED HERE
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }

    @Transactional
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

        String otpCode = generateOtp();
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));

        repository.saveAndFlush(user);
        System.out.println("\n\n\n=================================================");
        System.out.println("🚨 DEV HACK OTP CODE FOR " + user.getEmail() + " IS: " + otpCode);
        System.out.println("=================================================\n\n\n");

        try {
            emailService.sendOtpEmail(user.getEmail(), otpCode);
        } catch (RuntimeException ex) {
            System.err.println("Failed to send OTP email: " + ex.getMessage());
        }
    }

    @Transactional
    public void generatePasswordResetOtp(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("If that email exists, a recovery code has been sent."));
        // Security best practice: Don't reveal if an email exists to prevent user enumeration!

        String otpCode = generateOtp();
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));

        repository.save(user);

        // You can reuse your existing email service here, or create a specific "sendPasswordResetEmail" method
        emailService.sendOtpEmail(user.getEmail(), otpCode);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        System.out.println("\n=== PASSWORD RESET DEBUG ===");
        System.out.println("1. Email received: " + request.getEmail());
        System.out.println("2. New Password received: " + request.getNewPassword());
        System.out.println("==============================\n");
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Clean the incoming OTP
        String cleanIncomingCode = request.getOtpCode() != null ?
                request.getOtpCode().replaceAll("[\\s\\-,]", "") : "";

        // 2. Verify OTP exists and matches
        if (user.getOtpCode() == null || !user.getOtpCode().equals(cleanIncomingCode)) {
            throw new RuntimeException("Invalid verification code");
        }

        // 3. Verify OTP is not expired
        if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new RuntimeException("Verification code has expired");
        }

        // 4. Update the password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // 5. Clear the OTP so it can't be used again
        user.setOtpCode(null);
        user.setOtpExpiry(null);

        repository.saveAndFlush(user);
    }
    public void resendOtp(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newOtpCode = generateOtp();
        user.setOtpCode(newOtpCode);
        user.setOtpExpiry(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));
        repository.save(user);

        emailService.sendOtpEmail(user.getEmail(), newOtpCode);
    }

    // --- VERIFICATION FLOW ---
    @Transactional
    public AuthenticationResponse verifyOtp(VerificationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Scrub the incoming code: Remove any hidden spaces, dashes, or commas sent by React
        String cleanIncomingCode = request.getCode() != null ?
                request.getCode().replaceAll("[\\s\\-,]", "") : "";

        // 2. DEBUG: See exactly what React sent vs what the Database expects!
        System.out.println("\n--- OTP VERIFICATION DEBUG ---");
        System.out.println("OTP in Database: '" + user.getOtpCode() + "'");
        System.out.println("Raw from React : '" + request.getCode() + "'");
        System.out.println("Cleaned Code   : '" + cleanIncomingCode + "'");
        System.out.println("------------------------------\n");
        System.out.println("========== OTP DEBUG ==========");
        System.out.println("1. What the user typed: " + cleanIncomingCode);
        System.out.println("2. What the DB has: " + user.getOtpCode());
        System.out.println("3. DB Expiry Time: " + user.getOtpExpiry());
        System.out.println("4. Server Current Time (UTC): " + LocalDateTime.now(ZoneOffset.UTC));
        System.out.println("===============================");
        // 3. Compare the cleaned code
        if (user.getOtpCode() == null || !user.getOtpCode().equals(cleanIncomingCode)) {
            throw new RuntimeException("Invalid verification code");
        }
//        if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
//            throw new RuntimeException("Verification code has expired");
//        }

        user.setOtpCode(null);
        user.setOtpExpiry(null);

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