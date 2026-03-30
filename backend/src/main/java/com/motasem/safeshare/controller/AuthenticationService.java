package com.motasem.safeshare.controller; // Ensure this matches your package

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.security.JwtService;
import com.motasem.safeshare.services.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // 1. Inject our new Post Office!
    private final EmailService emailService;

    // Helper method to generate a 6-digit random number
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    public AuthenticationResponse register(RegisterRequest request) {
        // 1. ADD THIS CHECK: Verify the email isn't already taken
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            // You can throw a RuntimeException here, or better yet, a custom exception
            // that your GlobalExceptionHandler translates into an HTTP 409 Conflict.
            throw new RuntimeException("A user with this email is already registered.");
        }
        String uniqueTag = "@" + request.getFullName().replaceAll("\\s+", "").toLowerCase() +
                "_" + UUID.randomUUID().toString().substring(0, 5);
        // 2. Proceed with saving the user if the email is available
        var user = User.builder()
                .searchTag(request.getSearchTag())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .searchTag(uniqueTag) // <--- ADD THIS LINE HERE!
                .publicKey(request.getPublicKey())
                .encryptedPrivateKey(request.getEncryptedPrivateKey())
                .keySalt(request.getKeySalt())
                .keyIv(request.getKeyIv())
                .build();

        repository.save(user);
        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .publicKey(user.getPublicKey()) // <-- ADD THIS
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .keyIv(user.getKeyIv())
                .build();
    }

    // --- MILESTONE 2: THE MODIFIED LOGIN FLOW ---

    public void authenticate(AuthenticationRequest request) {
        // 1. Verify the user's email and password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()
                )
        );

        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Generate a secure 6-digit code
        String otpCode = generateOtp();

        // 3. Save it to the database with a 10-minute expiration
        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        repository.save(user);

        // 4. Send the email!
        emailService.sendOtpEmail(user.getEmail(), otpCode);

        // Notice we do NOT return the AuthenticationResponse here anymore!
    }

    // --- MILESTONE 3: THE VERIFICATION FLOW ---

    public AuthenticationResponse verifyOtp(VerificationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Check if the code matches
        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        // 2. Check if the code is expired
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired");
        }

        // 3. Success! Clear the OTP so it can't be used again
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        repository.save(user);

        // 4. Generate the JWT and finally hand over the E2EE Keys!
        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .publicKey(user.getPublicKey())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .keyIv(user.getKeyIv())
                .build();
    }
}