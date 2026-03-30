package com.motasem.safeshare.services;

import com.motasem.safeshare.model.FileEntity;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
 import java.util.List;
 import java.util.stream.Collectors;
 import com.motasem.safeshare.controller.FileResponse;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {
    public List<FileResponse> getUserFiles(User owner) {
        // Fetch from DB using the repository method we wrote earlier
        List<FileEntity> userFiles = fileRepository.findAllByOwnerId(owner.getId());

        // Map the database entities to clean JSON responses
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

    private final FileRepository fileRepository;

    // The physical folder on your server where files will be saved
    private final String UPLOAD_DIR = "uploads/";

    public FileEntity uploadSecureFile(
            MultipartFile encryptedBlob,
            String originalName,
            String fileType,
            Long sizeBytes,
            Boolean compressed,
            String encryptedFileKey,
            String iv,
            User owner // This is automatically grabbed from the JWT token!
    ) throws IOException {

        // 1. Create the 'uploads' directory if it doesn't exist yet
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. Generate a totally unique, random file name for the hard drive
        // (This prevents files with the same name from overwriting each other)
        String uniqueFileName = UUID.randomUUID().toString() + ".enc";
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);

        // 3. Save the scrambled bytes physically to the hard drive
        Files.write(filePath, encryptedBlob.getBytes());

        // 4. Save the metadata and RSA-locked AES keys to PostgreSQL
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
}