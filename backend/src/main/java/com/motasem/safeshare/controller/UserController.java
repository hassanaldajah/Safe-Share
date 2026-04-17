package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // ─── 1. EXISTING SEARCH ENDPOINT ────────────────────────────────────────────────
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

    // ─── 2. NEW PROFILE IMAGE UPLOAD ────────────────────────────────────────────────
    @Data
    public static class ImageUpdateRequest {
        private String profileImage;
    }

    @PutMapping("/profile/image")
    public ResponseEntity<?> updateProfileImage(
            @RequestBody ImageUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {

        try {
            // Find the user in the DB (to ensure we are attached to the Hibernate session)
            User userToUpdate = userRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            userToUpdate.setProfileImage(request.getProfileImage());
            userRepository.save(userToUpdate);

            return ResponseEntity.ok("Profile image updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}