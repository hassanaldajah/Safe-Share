package com.motasem.safeshare.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    // --- UPDATED: Step 1 of Login (Send OTP) ---
    @PostMapping("/authenticate")
    public ResponseEntity<String> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        service.authenticate(request);
        return ResponseEntity.ok("OTP sent to your email.");
    }

    // --- NEW: Step 2 of Login (Verify OTP & Get Keys) ---
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthenticationResponse> verifyOtp(
            @RequestBody VerificationRequest request
    ) {
        return ResponseEntity.ok(service.verifyOtp(request));
    }
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        service.resendOtp(email);
        return ResponseEntity.ok("New OTP sent successfully");
    }
    // 🔥 ADD THIS SAFETY NET 🔥
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleExceptions(RuntimeException ex) {
        // This grabs your custom message and sends it back to React cleanly!
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        try {
            String email = request.get("email");
            service.generatePasswordResetOtp(email);
            return ResponseEntity.ok("Recovery email sent if the account exists.");
        } catch (Exception e) {
            // Always return OK to prevent hackers from guessing emails
            return ResponseEntity.ok("Recovery email sent if the account exists.");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            service.resetPassword(request);
            return ResponseEntity.ok("Password has been successfully reset.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}