package com.motasem.safeshare.controller;

import com.motasem.safeshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<UserSearchResponse> searchUserByTag(@RequestParam String tag) {

        // Find the user by their tag
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
}