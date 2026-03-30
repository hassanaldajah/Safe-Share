package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.services.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile encryptedBlob,
            @RequestParam("originalName") String originalName,
            @RequestParam("fileType") String fileType,
            @RequestParam("sizeBytes") Long sizeBytes,
            @RequestParam("compressed") Boolean compressed,
            @RequestParam("encryptedFileKey") String encryptedFileKey,
            @RequestParam("iv") String iv,
            @AuthenticationPrincipal User currentUser // Spring Security magically extracts the User from the JWT!
    ) {
        try {
            fileService.uploadSecureFile(
                    encryptedBlob, originalName, fileType, sizeBytes,
                    compressed, encryptedFileKey, iv, currentUser
            );
            return ResponseEntity.ok("File uploaded and secured successfully!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    // --- ADD THIS NEW METHOD ---
    @GetMapping
    public ResponseEntity<List<FileResponse>> getMyFiles(
            @AuthenticationPrincipal User currentUser
    ) {
        // Spring Security safely guarantees 'currentUser' is the person holding the valid JWT token
        List<FileResponse> myFiles = fileService.getUserFiles(currentUser);
        return ResponseEntity.ok(myFiles);
    }
}