package com.motasem.safeshare.services;

import com.motasem.safeshare.controller.*;
import com.motasem.safeshare.model.FileEntity;
import com.motasem.safeshare.model.FileShare;
import com.motasem.safeshare.model.GroupEntity;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.FileRepository;
import com.motasem.safeshare.repository.FileShareRepository;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.repository.GroupRepository;
import com.motasem.safeshare.repository.GroupMemberRepository;
import com.motasem.safeshare.transaction.FileTransaction;
import com.motasem.safeshare.repository.FileTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileRepository fileRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;
    private final FileTransactionRepository fileTransactionRepository;

    // --- NEW INJECTIONS FOR GROUP LOGIC ---
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final AuditService auditService;

    private final String UPLOAD_DIR = "uploads/";

    // 1. Fetch ONLY active files for "My Folders"
    public List<FileResponse> getUserFiles(User owner) {
        List<FileEntity> userFiles = fileRepository.findAllByOwnerAndGroupIsNullAndIsDeletedFalse(owner);
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

    public java.util.List<SharedFileResponse> getSharedFiles(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var sharedFiles = fileShareRepository.findAllBySharedWith_Id(user.getId());

        return sharedFiles.stream().map(share -> SharedFileResponse.builder()
                .fileId(share.getFile().getId())
                .fileName(share.getFile().getOriginalName())
                .sharedBy(share.getSharedBy())
                .encryptedKey(share.getEncryptedKey())
                .build()
        ).toList();
    }

    // --- SMART UPLOAD LOGIC WITH GROUPS ---
    @Transactional
    public FileEntity uploadSecureFile(
            MultipartFile encryptedBlob, String originalName, String fileType,
            Long sizeBytes, Boolean compressed, String encryptedFileKey,
            String iv, User currentUser, Integer groupId) throws IOException {

        // 1. Save Physical File
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String uniqueFileName = UUID.randomUUID().toString() + ".enc";
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
        Files.write(filePath, encryptedBlob.getBytes());

        // 2. Build Database Entity
        FileEntity fileEntity = FileEntity.builder()
                .originalName(originalName)
                .fileType(fileType)
                .sizeBytes(sizeBytes)
                .compressed(compressed)
                .virusScanStatus("clean")
                .encryptedFileKey(encryptedFileKey)
                .iv(iv)
                .filePath(filePath.toString())
                .owner(currentUser)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false) // Assuming this is your soft-delete flag
                .build();

        // 3. NEW: Link the group if one was provided
        if (groupId != null) {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            // Security Check: Ensure the user uploading is actually in this group!
            groupMemberRepository.findByGroupAndUser(group, currentUser)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this group."));

            fileEntity.setGroup(group);

            // Log the upload to the group audit trail!
            auditService.logEvent(group, currentUser.getFullName(), "Uploaded File", fileEntity.getOriginalName(), "info");
        }

        return fileRepository.save(fileEntity);
    }

    // --- SMART DOWNLOAD LOGIC WITH ACTION TYPE ---
    public Resource downloadSecureFile(Integer fileId, User currentUser, String action) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        boolean isOwner = fileEntity.getOwner().getId().equals(currentUser.getId());
        var shareRecord = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, currentUser.getId());

        if (!isOwner && shareRecord.isEmpty()) {
            throw new RuntimeException("Unauthorized access to file!");
        }

        if (!isOwner && shareRecord.isPresent()) {
            FileShare share = shareRecord.get();

            if ("view".equalsIgnoreCase(action)) {
                if (share.getMaxViews() != null) {
                    if (share.getMaxViews() <= 0) {
                        throw new RuntimeException("Security Exception: View limit reached for this file.");
                    }
                    share.setMaxViews(share.getMaxViews() - 1);
                }
            } else {
                if (share.getMaxDownloads() != null) {
                    if (share.getMaxDownloads() <= 0) {
                        throw new RuntimeException("Security Exception: Download limit reached for this file.");
                    }
                    share.setMaxDownloads(share.getMaxDownloads() - 1);
                }
            }
            fileShareRepository.save(share);
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

    public UserSearchResponse searchUserByTag(String searchTag) {
        User user = userRepository.findBySearchTag(searchTag)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserSearchResponse(user.getSearchTag(), user.getFullName(), user.getPublicKey());
    }

    public java.util.Map<String, String> getFileMetadataForDownload(Integer fileId, User currentUser) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        java.util.Map<String, String> meta = new java.util.HashMap<>();
        meta.put("iv", file.getIv());
        meta.put("fileType", file.getFileType());

        if (file.getOwner().getId().equals(currentUser.getId())) {
            meta.put("encryptedKey", file.getEncryptedFileKey());
        } else {
            var share = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Unauthorized access to file metadata"));
            meta.put("encryptedKey", share.getEncryptedKey());
        }
        return meta;
    }

    // --- TRASH BIN LOGIC ---
    public List<FileResponse> getTrashedFiles(User owner) {
        List<FileEntity> trashedFiles = fileRepository.findAllByOwnerAndIsDeletedTrue(owner);

        return trashedFiles.stream().map(file -> FileResponse.builder()
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

    public void moveToTrash(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can delete this file.");
        }

        file.setDeleted(true);
        file.setDeletedAt(LocalDateTime.now());
        fileRepository.save(file);
    }

    public void restoreFile(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can restore this file.");
        }

        file.setDeleted(false);
        file.setDeletedAt(null);
        fileRepository.save(file);
    }

    public void permanentlyDelete(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can delete this file.");
        }

        try {
            Path filePath = Paths.get(file.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("Failed to delete physical file: " + e.getMessage());
        }
        fileRepository.delete(file);
    }

    public void emptyTrash(User owner) {
        List<FileEntity> trashFiles = fileRepository.findAllByOwnerAndIsDeletedTrue(owner);
        for (FileEntity file : trashFiles) {
            try {
                Path filePath = Paths.get(file.getFilePath());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                System.err.println("Failed to delete physical file: " + e.getMessage());
            }
        }
        fileRepository.deleteAll(trashFiles);
    }

    // --- MANAGE ACCESS LOGIC ---
    public List<ShareAccessResponse> getFileAccessList(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can view the access list.");
        }

        List<FileShare> shares = fileShareRepository.findAllByFile_Id(fileId);

        return shares.stream().map(share -> new ShareAccessResponse(
                share.getSharedWith().getSearchTag(),
                share.getMaxViews(),
                share.getMaxDownloads(),
                share.getCanReshare()
        )).collect(Collectors.toList());
    }

    public void revokeAccess(Integer fileId, String receiverTag, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can revoke access.");
        }

        User receiver = userRepository.findBySearchTag(receiverTag)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FileShare share = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, receiver.getId())
                .orElseThrow(() -> new RuntimeException("Access record not found."));

        fileShareRepository.delete(share);
    }

    // --- UPDATED SMART SHARE LOGIC ---
    public void shareFile(Integer fileId, ShareFileRequest request, User sender) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        boolean isOwner = file.getOwner().getId().equals(sender.getId());

        if (!isOwner) {
            FileShare senderShareRecord = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, sender.getId())
                    .orElseThrow(() -> new RuntimeException("You do not have access to this file!"));

            if (!Boolean.TRUE.equals(senderShareRecord.getCanReshare())) {
                throw new RuntimeException("You do not have permission to re-share this file!");
            }
        }

        User receiver = userRepository.findBySearchTag(request.getTargetSearchTag())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        var existingShare = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, receiver.getId());
        FileShare fileShare;

        if (existingShare.isPresent()) {
            fileShare = existingShare.get();
            fileShare.setMaxDownloads(request.getMaxDownloads());
            fileShare.setMaxViews(request.getMaxViews());
            fileShare.setCanReshare(request.getCanReshare() != null ? request.getCanReshare() : false);
            fileShare.setEncryptedKey(request.getEncryptedKey());
        } else {
            fileShare = FileShare.builder()
                    .file(file)
                    .sharedWith(receiver)
                    .encryptedKey(request.getEncryptedKey())
                    .sharedBy(sender.getSearchTag())
                    .maxDownloads(request.getMaxDownloads())
                    .maxViews(request.getMaxViews())
                    .canReshare(request.getCanReshare() != null ? request.getCanReshare() : false)
                    .build();
        }
        fileShareRepository.save(fileShare);

        FileTransaction sentLog = new FileTransaction();
        sentLog.setFileId(file.getId().toString());
        sentLog.setFileName(file.getOriginalName());
        sentLog.setSenderTag(sender.getSearchTag());
        sentLog.setReceiverTag(receiver.getSearchTag());
        sentLog.setTransactionType(FileTransaction.TransactionType.SENT);
        sentLog.setStatus(FileTransaction.TransactionStatus.COMPLETED);
        sentLog.setFileSizeBytes(file.getSizeBytes());
        sentLog.setOwner(sender);
        sentLog.setCanReshare(request.getCanReshare() != null ? request.getCanReshare() : false);
        fileTransactionRepository.save(sentLog);

        FileTransaction receivedLog = new FileTransaction();
        receivedLog.setFileId(file.getId().toString());
        receivedLog.setFileName(file.getOriginalName());
        receivedLog.setSenderTag(sender.getSearchTag());
        receivedLog.setReceiverTag(receiver.getSearchTag());
        receivedLog.setTransactionType(FileTransaction.TransactionType.RECEIVED);
        receivedLog.setStatus(FileTransaction.TransactionStatus.COMPLETED);
        receivedLog.setFileSizeBytes(file.getSizeBytes());
        receivedLog.setOwner(receiver);
        receivedLog.setCanReshare(request.getCanReshare() != null ? request.getCanReshare() : false);
        fileTransactionRepository.save(receivedLog);
    }

    public List<FileResponse> getSharedWithMeFiles(User receiver) {
        List<FileShare> shares = fileShareRepository.findAllBySharedWith_Id(receiver.getId());

        return shares.stream().map(share -> FileResponse.builder()
                .id(share.getFile().getId())
                .name(share.getFile().getOriginalName())
                .fileType(share.getFile().getFileType())
                .sizeBytes(share.getFile().getSizeBytes())
                .compressed(share.getFile().getCompressed())
                .virusScan(share.getFile().getVirusScanStatus())
                .uploadedAt(share.getFile().getUploadedAt())
                .encryptedFileKey(share.getEncryptedKey())
                .iv(share.getFile().getIv())
                .build()
        ).collect(Collectors.toList());
    }

    public java.util.Map<String, Object> getDashboardStats(User currentUser) {
        var myFiles = fileRepository.findAllByOwnerId(currentUser.getId());
        long totalFiles = myFiles.size();
        long storageUsed = myFiles.stream()
                .mapToLong(file -> file.getSizeBytes() != null ? file.getSizeBytes() : 0L)
                .sum();
        long storageLimit = 5L * 1024 * 1024 * 1024;

        long sentShares = fileShareRepository.countBySharedBy(currentUser.getSearchTag());
        long receivedShares = fileShareRepository.countBySharedWith_Id(currentUser.getId());

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalFiles", totalFiles);
        stats.put("storageUsedBytes", storageUsed);
        stats.put("storageLimitBytes", storageLimit);
        stats.put("totalSharedSent", sentShares);
        stats.put("totalSharedReceived", receivedShares);

        return stats;
    }
}