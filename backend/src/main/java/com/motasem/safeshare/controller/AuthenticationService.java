package com.motasem.safeshare.controller;

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
    private final EmailService emailService;

    // Helper method to generate a 6-digit random number
    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    // --- UPDATED REGISTRATION FLOW ---
    public AuthenticationResponse register(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("A user with this email is already registered.");
        }

        String uniqueTag = "@" + request.getFullName().replaceAll("\\s+", "").toLowerCase() +
                "_" + UUID.randomUUID().toString().substring(0, 5);

        // 1. Generate the code
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
                .otpCode(otpCode) // 2. Save code to DB
                .otpExpiry(LocalDateTime.now().plusMinutes(10))
                .build();

        repository.save(user);
        emailService.sendOtpEmail(user.getEmail(), user.getOtpCode());
        // --- THE MISSING LINK: ADD THIS LINE BELOW ---
        emailService.sendOtpEmail(user.getEmail(), otpCode);
        // ----------------------------------------------

        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .publicKey(user.getPublicKey())
                .encryptedPrivateKey(user.getEncryptedPrivateKey())
                .keySalt(user.getKeySalt())
                .keyIv(user.getKeyIv())
                .build();
    }

    // --- LOGIN FLOW ---
    public void authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()
                )
        );

        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otpCode = generateOtp();

        user.setOtpCode(otpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        repository.save(user);

        // 🚨 ADDED THE DEV HACK FOR LOGINS TOO 🚨
        System.out.println("\n\n\n=================================================");
        System.out.println("🚨 DEV HACK OTP CODE FOR " + user.getEmail() + " IS: " + otpCode);
        System.out.println("=================================================\n\n\n");

        emailService.sendOtpEmail(user.getEmail(), otpCode);
    }
    public void resendOtp(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a fresh code and give them 10 more minutes
        String newOtpCode = generateOtp();
        user.setOtpCode(newOtpCode);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        repository.save(user);

        // Send the new code via email!
        emailService.sendOtpEmail(user.getEmail(), newOtpCode);
    }
    // --- VERIFICATION FLOW ---
    public AuthenticationResponse verifyOtp(VerificationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification code has expired");
        }

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
                .build();
    }
}