package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/backup")
@RequiredArgsConstructor
public class BackupController {

    private final UserRepository userRepository;

    @PostMapping("/save")
    public ResponseEntity<?> saveBackup(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User currentUser) {
        try {
            String encryptedKey = payload.get("encryptedPrivateKey");
            String salt = payload.get("keySalt");
            String iv = payload.get("keyIv");

            if (encryptedKey == null || encryptedKey.isEmpty()) {
                return ResponseEntity.badRequest().body("No backup data provided!");
            }

            // Save to your EXISTING columns!
            currentUser.setEncryptedPrivateKey(encryptedKey);
            currentUser.setKeySalt(salt);
            currentUser.setKeyIv(iv);
            userRepository.save(currentUser);

            return ResponseEntity.ok("Key backup securely saved to the cloud!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to save backup: " + e.getMessage());
        }
    }

    @GetMapping("/restore")
    public ResponseEntity<?> getBackup(@AuthenticationPrincipal User currentUser) {
        try {
            if (currentUser.getEncryptedPrivateKey() == null) {
                return ResponseEntity.badRequest().body("No backup found in the cloud.");
            }

            // Return all 3 existing columns
            return ResponseEntity.ok(Map.of(
                    "encryptedPrivateKey", currentUser.getEncryptedPrivateKey(),
                    "keySalt", currentUser.getKeySalt(),
                    "keyIv", currentUser.getKeyIv()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to retrieve backup: " + e.getMessage());
        }
    }
}