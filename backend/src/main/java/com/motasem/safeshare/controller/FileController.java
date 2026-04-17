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

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;


    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile encryptedBlob,
            @RequestParam(value = "groupId", required = false) Integer groupId, // NEW: Optional Group ID
            @RequestParam("originalName") String originalName,
            @RequestParam("fileType") String fileType,
            @RequestParam("sizeBytes") Long sizeBytes,
            @RequestParam("compressed") Boolean compressed,
            @RequestParam("encryptedFileKey") String encryptedFileKey,
            @RequestParam("iv") String iv,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            // PASS THE groupId HERE!
            fileService.uploadSecureFile(
                    encryptedBlob, originalName, fileType, sizeBytes,
                    compressed, encryptedFileKey, iv, currentUser, groupId
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

    // --- UPDATED DOWNLOAD ENDPOINT WITH ACTION PARAMETER ---
    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "download") String action,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            Resource resource = fileService.downloadSecureFile(id, currentUser, action);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"encrypted_file.enc\"")
                    .body(resource);
        } catch (Exception e) {
            // Sends the error message text back to React!
            return ResponseEntity.status(403).body(e.getMessage());
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
    // --- MANAGE ACCESS ENDPOINTS ---
    @GetMapping("/{fileId}/shares")
    public ResponseEntity<?> getFileAccessList(
            @PathVariable Integer fileId,
            @AuthenticationPrincipal User currentUser) {
        try {
            return ResponseEntity.ok(fileService.getFileAccessList(fileId, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{fileId}/shares/{receiverTag}")
    public ResponseEntity<?> revokeAccess(
            @PathVariable Integer fileId,
            @PathVariable String receiverTag,
            @AuthenticationPrincipal User currentUser) {
        try {
            fileService.revokeAccess(fileId, receiverTag, currentUser);
            return ResponseEntity.ok("Access permanently revoked for " + receiverTag);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/search-user")
    public ResponseEntity<?> searchUser(@RequestParam String searchTag) {
        try {
            return ResponseEntity.ok(fileService.searchUserByTag(searchTag));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // --- TRASH ENDPOINTS ---

    @GetMapping("/trash")
    public ResponseEntity<?> getTrashedFiles(@AuthenticationPrincipal User currentUser) {
        // You can create a quick service method for this, or call repo directly if allowed by your architecture
        return ResponseEntity.ok(fileService.getTrashedFiles(currentUser));
    }

    @PutMapping("/{fileId}/trash")
    public ResponseEntity<?> moveToTrash(@PathVariable Integer fileId, @AuthenticationPrincipal User currentUser) {
        fileService.moveToTrash(fileId, currentUser);
        return ResponseEntity.ok("File moved to trash.");
    }

    @PutMapping("/{fileId}/restore")
    public ResponseEntity<?> restoreFile(@PathVariable Integer fileId, @AuthenticationPrincipal User currentUser) {
        fileService.restoreFile(fileId, currentUser);
        return ResponseEntity.ok("File restored.");
    }

    @DeleteMapping("/{fileId}/permanent")
    public ResponseEntity<?> permanentlyDelete(@PathVariable Integer fileId, @AuthenticationPrincipal User currentUser) {
        fileService.permanentlyDelete(fileId, currentUser);
        return ResponseEntity.ok("File permanently deleted.");
    }

    @DeleteMapping("/trash/empty")
    public ResponseEntity<?> emptyTrash(@AuthenticationPrincipal User currentUser) {
        fileService.emptyTrash(currentUser);
        return ResponseEntity.ok("Trash emptied.");
    }
    @GetMapping("/{fileId}/metadata")
    public ResponseEntity<java.util.Map<String, String>> getFileMetadata(
            @PathVariable Integer fileId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(fileService.getFileMetadataForDownload(fileId, currentUser));
    }

    @PostMapping("/{fileId}/share")
    public ResponseEntity<?> shareFile(
            @PathVariable Integer fileId,
            @RequestBody ShareFileRequest shareRequest,
            @AuthenticationPrincipal User currentUser
    ) {
        try {
            fileService.shareFile(fileId, shareRequest, currentUser);
            return ResponseEntity.ok("File shared securely!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/shared")
    public ResponseEntity<List<SharedFileResponse>> getSharedFiles(Principal principal) {
        var sharedFiles = fileService.getSharedFiles(principal.getName());
        return ResponseEntity.ok(sharedFiles);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(fileService.getDashboardStats(currentUser));
    }
}