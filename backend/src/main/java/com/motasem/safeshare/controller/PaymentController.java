package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final UserRepository userRepository;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@AuthenticationPrincipal User user) {
        try {
            // Mock checkout session creation
            // Return a fake checkout URL that directly leads to the frontend success page
            return ResponseEntity.ok(Map.of("url", "http://localhost:5173/payment-success"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/mock-success")
    public ResponseEntity<String> handleMockSuccess(@AuthenticationPrincipal User user) {
        try {
            if (user != null) {
                user.setRole("PREMIUM");
                userRepository.save(user);
                return ResponseEntity.ok("Success: User upgraded to PREMIUM");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User not authenticated");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error upgrading user: " + e.getMessage());
        }
    }
}
