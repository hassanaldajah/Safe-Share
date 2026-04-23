package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.motasem.safeshare.services.S3Service s3Service;

    @GetMapping("/search")
    public ResponseEntity<UserSearchResponse> searchUserByTag(@RequestParam String tag) {

        var user = userRepository.findBySearchTag(tag)
                .orElseThrow(() -> new RuntimeException("User not found with tag: " + tag));

        // Map it to our safe DTO
        var response = UserSearchResponse.builder()
                .searchTag(user.getSearchTag())
                .fullName(user.getFullName())
                .publicKey(user.getPublicKey())
                .build();

        return ResponseEntity.ok(response);
    }
    // ==========================================
    // GET UI PREFERENCES
    // ==========================================
    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(java.util.Map.of(
                "theme", currentUser.getTheme() != null ? currentUser.getTheme() : "system",
                "language", currentUser.getLanguage() != null ? currentUser.getLanguage() : "en"
        ));
    }

    // ==========================================
    // UPDATE UI PREFERENCES
    // ==========================================
    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {
        try {
            if (request.containsKey("theme")) {
                currentUser.setTheme(request.get("theme"));
            }
            if (request.containsKey("language")) {
                currentUser.setLanguage(request.get("language"));
            }

            userRepository.save(currentUser);
            return ResponseEntity.ok("Preferences updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating preferences.");
        }
    }

    // ==========================================
    // UPDATE PROFILE (FULL NAME)
    // ==========================================
    @Data
    public static class ProfileUpdateRequest {
        private String fullName;
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody ProfileUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            User userToUpdate = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                userToUpdate.setFullName(request.getFullName());
                userRepository.save(userToUpdate);
            }

            return ResponseEntity.ok(java.util.Map.of("message", "Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Error updating profile"));
        }
    }
    // ─── 2. NEW PROFILE IMAGE UPLOAD ────────────────────────────────────────────────
    @Data
    public static class ImageUpdateRequest {
        private String profilePictureUrl;
    }

    @PutMapping("/profile/image")
    public ResponseEntity<?> updateProfileImage(
            @RequestBody ImageUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {

        try {
            // Find the user in the DB (to ensure we are attached to the Hibernate session)
            User userToUpdate = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            userToUpdate.setProfilePictureUrl(request.getProfilePictureUrl());
            userRepository.save(userToUpdate);

            return ResponseEntity.ok(java.util.Map.of("message", "Profile image updated successfully", "url", request.getProfilePictureUrl()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        
        try {
            // 1. Upload to S3
            String publicUrl = s3Service.uploadProfilePicture(file);

            // 2. Save URL to database
            User userToUpdate = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            userToUpdate.setProfilePictureUrl(publicUrl);
            userRepository.save(userToUpdate);

            // 3. Return the new URL so the frontend can update its state instantly
            return ResponseEntity.ok(java.util.Map.of("message", "Profile picture uploaded successfully", "url", publicUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
    // ==========================================
    // CHANGE PASSWORD ENDPOINT
    // ==========================================
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody java.util.Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            // 1. Verify the current password matches what is in the database
            if (!passwordEncoder.matches(currentPassword, currentUser.getPassword())) {
                return ResponseEntity.badRequest().body("Incorrect current password.");
            }

            currentUser.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(currentUser);

            return ResponseEntity.ok("Password updated successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating password.");
        }
    }
}