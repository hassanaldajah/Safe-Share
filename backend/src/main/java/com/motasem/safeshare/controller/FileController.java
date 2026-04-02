package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.services.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
            @AuthenticationPrincipal User currentUser
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

    @GetMapping
    public ResponseEntity<List<FileResponse>> getMyFiles(
            @AuthenticationPrincipal User currentUser
    ) {
        List<FileResponse> myFiles = fileService.getUserFiles(currentUser);
        return ResponseEntity.ok(myFiles);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            Resource resource = fileService.downloadSecureFile(id, currentUser);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"encrypted_file.enc\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Integer id,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            fileService.deleteSecureFile(id, currentUser);
            return ResponseEntity.ok().body("File securely and permanently deleted!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Delete failed: " + e.getMessage());
        }
    }

    // --- NEW ENDPOINTS FOR SHARING ---

    @GetMapping("/search-user")
    public ResponseEntity<?> searchUser(@RequestParam String email) {
        try {
            return ResponseEntity.ok(fileService.searchUserByEmail(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareFile(
            @PathVariable Integer id,
            @RequestBody ShareRequest shareRequest,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            fileService.shareFile(id, shareRequest, currentUser);
            return ResponseEntity.ok("File shared successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/shared-with-me")
    public ResponseEntity<List<FileResponse>> getSharedWithMeFiles(
            @AuthenticationPrincipal User currentUser
    ) {
        List<FileResponse> sharedFiles = fileService.getSharedWithMeFiles(currentUser);
        return ResponseEntity.ok(sharedFiles);
    }
}