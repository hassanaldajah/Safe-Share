package com.motasem.safeshare.services;

import com.motasem.safeshare.model.FileEntity;
import com.motasem.safeshare.model.FileShare;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.FileRepository;
import com.motasem.safeshare.repository.FileShareRepository;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.controller.FileResponse;
import com.motasem.safeshare.controller.UserSearchResponse;
import com.motasem.safeshare.controller.ShareRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/";

    public List<FileResponse> getUserFiles(User owner) {
        List<FileEntity> userFiles = fileRepository.findAllByOwnerId(owner.getId());
        return userFiles.stream().map(file -> FileResponse.builder()
                .id(file.getId())
                .name(file.getOriginalName())
                .fileType(file.getFileType())
                .sizeBytes(file.getSizeBytes())
                .compressed(file.getCompressed())
                .virusScan(file.getVirusScanStatus())
                .uploadedAt(file.getUploadedAt())
                .encryptedFileKey(file.getEncryptedFileKey())
                .iv(file.getIv())
                .build()
        ).collect(Collectors.toList());
    }

    public FileEntity uploadSecureFile(
            MultipartFile encryptedBlob, String originalName, String fileType,
            Long sizeBytes, Boolean compressed, String encryptedFileKey,
            String iv, User owner
    ) throws IOException {

        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String uniqueFileName = UUID.randomUUID().toString() + ".enc";
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
        Files.write(filePath, encryptedBlob.getBytes());

        FileEntity fileEntity = FileEntity.builder()
                .originalName(originalName)
                .fileType(fileType)
                .sizeBytes(sizeBytes)
                .compressed(compressed)
                .virusScanStatus("clean")
                .encryptedFileKey(encryptedFileKey)
                .iv(iv)
                .filePath(filePath.toString())
                .owner(owner)
                .build();

        return fileRepository.save(fileEntity);
    }

    public Resource downloadSecureFile(Integer fileId, User currentUser) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        // SECURITY CHECK: Is the user the owner OR has it been shared with them?
        boolean isOwner = fileEntity.getOwner().getId().equals(currentUser.getId());
        boolean isShared = fileShareRepository.findByFileIdAndSharedWithId(fileId, currentUser.getId()).isPresent();

        if (!isOwner && !isShared) {
            throw new RuntimeException("Unauthorized access to file!");
        }

        try {
            Path filePath = Paths.get(fileEntity.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read the file from disk!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error reading file path: " + e.getMessage());
        }
    }

    public void deleteSecureFile(Integer fileId, User currentUser) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        if (!fileEntity.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized attempt to delete file!");
        }

        try {
            Path filePath = Paths.get(fileEntity.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not delete physical file from disk: " + e.getMessage());
        }

        fileRepository.delete(fileEntity);
    }

    // --- NEW: SEARCH FOR USER'S PUBLIC KEY ---
    public UserSearchResponse searchUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserSearchResponse(user.getId(), user.getEmail(), user.getPublicKey());
    }

    // --- NEW: SHARE FILE LOGIC ---
    public void shareFile(Integer fileId, ShareRequest request, User sender) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(sender.getId())) {
            throw new RuntimeException("You can only share your own files!");
        }

        User receiver = userRepository.findByEmail(request.getReceiverEmail())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (fileShareRepository.findByFileIdAndSharedWithId(fileId, receiver.getId()).isPresent()) {
            throw new RuntimeException("File is already shared with this user!");
        }

        FileShare fileShare = FileShare.builder()
                .file(file)
                .sharedWith(receiver)
                .receiverEncryptedKey(request.getReceiverEncryptedKey())
                .build();

        fileShareRepository.save(fileShare);
    }

    // --- NEW: GET "SHARED WITH ME" FILES ---
    public List<FileResponse> getSharedWithMeFiles(User receiver) {
        List<FileShare> shares = fileShareRepository.findAllBySharedWithId(receiver.getId());

        // Map the FileShare objects back into standard FileResponses for the frontend
        return shares.stream().map(share -> FileResponse.builder()
                .id(share.getFile().getId())
                .name(share.getFile().getOriginalName())
                .fileType(share.getFile().getFileType())
                .sizeBytes(share.getFile().getSizeBytes())
                .compressed(share.getFile().getCompressed())
                .virusScan(share.getFile().getVirusScanStatus())
                .uploadedAt(share.getSharedAt())
                // CRITICAL: We pass the RECEIVER'S newly generated AES key, not the owner's!
                .encryptedFileKey(share.getReceiverEncryptedKey())
                .iv(share.getFile().getIv())
                .build()
        ).collect(Collectors.toList());
    }
}