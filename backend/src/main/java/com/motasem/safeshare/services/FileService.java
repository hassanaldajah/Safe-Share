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
import com.motasem.safeshare.repository.FileVersionRepository;
import com.motasem.safeshare.repository.FolderRepository;
import com.motasem.safeshare.model.FileVersion;
import com.motasem.safeshare.model.FolderEntity;
import com.motasem.safeshare.model.GroupMember;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
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
    private final FolderRepository folderRepository;
    private final AuditService auditService;
    private final S3StorageService s3StorageService;
    private final FileVersionRepository fileVersionRepository;
    private final NotificationService notificationService;
    private final SseService sseService;
    private final TransactionTemplate transactionTemplate;

    private final String UPLOAD_DIR = "uploads/";

    // 1. Fetch ONLY active files for "My Folders" or inside a specific folder
    public List<FileResponse> getUserFiles(User owner, Integer folderId) {
        List<FileEntity> userFiles;
        if (folderId == null) {
            userFiles = fileRepository.findAllByOwnerAndGroupIsNullAndParentFolderIsNullAndIsDeletedFalseAndIsBackupFalse(owner);
        } else {
            userFiles = fileRepository.findAllByOwnerAndGroupIsNullAndParentFolderIdAndIsDeletedFalseAndIsBackupFalse(owner, folderId);
        }
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
                .folderId(file.getParentFolder() != null ? file.getParentFolder().getId() : null)
                .build()
        ).collect(Collectors.toList());
    }

    public List<FileResponse> getAllUserFiles(User owner) {
        List<FileEntity> userFiles = fileRepository.findAllByOwnerAndGroupIsNullAndIsDeletedFalseAndIsBackupFalse(owner);
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
                .folderId(file.getParentFolder() != null ? file.getParentFolder().getId() : null)
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
    public FileEntity uploadSecureFile(
            MultipartFile encryptedBlob, String originalName, String fileType,
            Long sizeBytes, Boolean compressed, String encryptedFileKey,
            String iv, User currentUser, Integer groupId, Integer folderId,
            Integer maxDownloads, Integer maxViews) throws IOException {

        // 1. Upload to AWS S3 (OUTSIDE TRANSACTION)
        String uniqueFileName = UUID.randomUUID().toString() + ".enc";
        String awsVersionId = s3StorageService.uploadFile(uniqueFileName, encryptedBlob);

        // 2. Wrap DB operations in a programmatic transaction
        return transactionTemplate.execute(status -> {
            // Build Database Entity
            FileEntity fileEntity = FileEntity.builder()
                .originalName(originalName)
                .fileType(fileType)
                .sizeBytes(sizeBytes)
                .compressed(compressed)
                .virusScanStatus("clean")
                .encryptedFileKey(encryptedFileKey)
                .iv(iv)
                .filePath(uniqueFileName)
                .owner(currentUser)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false) // Assuming this is your soft-delete flag
                .maxDownloads(maxDownloads)
                .maxViews(maxViews)
                .currentDownloads(0)
                .currentViews(0)
                .build();

        if (folderId != null) {
            FolderEntity parentFolder = folderRepository.findByIdAndOwner(folderId, currentUser)
                    .orElseThrow(() -> new RuntimeException("Folder not found"));
            fileEntity.setParentFolder(parentFolder);
        }

        // 3. NEW: Link the group and check roles
        if (groupId != null) {
            GroupEntity group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Group not found"));

            // Security Check: Get the member
            var member = groupMemberRepository.findByGroupAndUser(group, currentUser)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this group."));

            // ENFORCE ROLE PERMISSION
            if (member.getRole() == com.motasem.safeshare.model.GroupRole.VIEWER) {
                throw new RuntimeException("Security Exception: Viewers are not allowed to upload files.");
            }

            fileEntity.setGroup(group);

            auditService.logEvent(group, currentUser.getFullName(), "Uploaded File", fileEntity.getOriginalName(), "info");

            // Notify group members
            List<GroupMember> groupMembers = groupMemberRepository.findAllByGroup(group);
            for (GroupMember m : groupMembers) {
                if (!m.getUser().getId().equals(currentUser.getId())) {
                    notificationService.createNotification(m.getUser(), currentUser.getFullName() + " uploaded a file to group " + group.getName() + ": " + originalName);
                }
            }
        }

        FileEntity savedFile = fileRepository.save(fileEntity);

            // 4. NEW: Create FileVersion record for Zero-Knowledge History
            FileVersion fileVersion = FileVersion.builder()
                    .file(savedFile)
                    .awsVersionId(awsVersionId)
                    .encryptedSize(sizeBytes)
                    .uploadedAt(LocalDateTime.now())
                    .build();
            fileVersionRepository.save(fileVersion);

            return savedFile;
        });
    }
    // --- CROSS-VAULT SHARING (SHARE TO GROUP) ---
    @Transactional
    public void copyFileToGroup(Integer fileId, Integer groupId, User currentUser) {
        // 1. Get the original private file
        FileEntity originalFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!originalFile.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the owner can share this file to a group.");
        }

        // 2. Verify Group Access & Permissions
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        var member = groupMemberRepository.findByGroupAndUser(group, currentUser)
                .orElseThrow(() -> new RuntimeException("You are not a member of this group."));

        if (member.getRole() == com.motasem.safeshare.model.GroupRole.VIEWER) {
            throw new RuntimeException("Viewers cannot share files to this group.");
        }

        // 3. Data Deduplication: Create new metadata pointing to the same physical file
        FileEntity groupFile = FileEntity.builder()
                .originalName(originalFile.getOriginalName())
                .fileType(originalFile.getFileType())
                .sizeBytes(originalFile.getSizeBytes())
                .compressed(originalFile.getCompressed())
                .virusScanStatus(originalFile.getVirusScanStatus())
                .encryptedFileKey(originalFile.getEncryptedFileKey())
                .iv(originalFile.getIv())
                .filePath(originalFile.getFilePath()) // <-- MAGIC HAPPENS HERE
                .owner(currentUser)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .group(group) // <-- LINK TO THE GROUP
                .build();

        fileRepository.save(groupFile);

        // 4. Log the action
        auditService.logEvent(group, currentUser.getFullName(), "Shared to Group", originalFile.getOriginalName() + " (from Private Vault)", "info");

        // 5. Notify group members
        List<GroupMember> groupMembers = groupMemberRepository.findAllByGroup(group);
        for (GroupMember m : groupMembers) {
            if (!m.getUser().getId().equals(currentUser.getId())) {
                notificationService.createNotification(m.getUser(), currentUser.getFullName() + " shared a file to group " + group.getName() + ": " + originalFile.getOriginalName());
            }
        }
    }
    private boolean fileIsSharedWithUser(Integer fileId, User currentUser) {
        FileEntity file = fileRepository.findById(fileId).orElse(null);
        if (file != null && file.getGroup() != null) {
            return groupMemberRepository.findByGroupAndUser(file.getGroup(), currentUser).isPresent();
        }
        return fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, currentUser.getId()).isPresent();
    }

    // --- SMART DOWNLOAD LOGIC WITH GROUPS & AUDIT ---
    public Resource downloadSecureFile(Integer fileId, User currentUser, String action) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        boolean isOwner = fileEntity.getOwner().getId().equals(currentUser.getId());
        boolean isShared = fileIsSharedWithUser(fileId, currentUser);

        if (!isOwner && !isShared) {
            throw new RuntimeException("Unauthorized: You do not have permission to access this file.");
        }

        // --- NEW: IS THIS A GROUP FILE? ---
        if (fileEntity.getGroup() != null) {

            // Handle downloads and views for group file
            if ("view".equalsIgnoreCase(action)) {
                if (fileEntity.getMaxViews() != null && fileEntity.getMaxViews() > 0) {
                    if (fileEntity.getCurrentViews() != null && fileEntity.getCurrentViews() >= fileEntity.getMaxViews()) {
                        throw new RuntimeException("Access Denied: View limit reached for this group file.");
                    }
                    fileEntity.setCurrentViews((fileEntity.getCurrentViews() == null ? 0 : fileEntity.getCurrentViews()) + 1);
                }
            } else {
                if (fileEntity.getMaxDownloads() != null && fileEntity.getMaxDownloads() > 0) {
                    if (fileEntity.getCurrentDownloads() != null && fileEntity.getCurrentDownloads() >= fileEntity.getMaxDownloads()) {
                        throw new RuntimeException("Access Denied: Download limit reached for this group file.");
                    }
                    fileEntity.setCurrentDownloads((fileEntity.getCurrentDownloads() == null ? 0 : fileEntity.getCurrentDownloads()) + 1);
                }
            }
            fileRepository.save(fileEntity); // Save updated counts

            // 2. Log the download to the group's Audit Log
            auditService.logEvent(fileEntity.getGroup(), currentUser.getFullName(), "Downloaded File", fileEntity.getOriginalName(), "info");
        }
        // --- IF NOT A GROUP FILE, CHECK PRIVATE SHARES ---
        else if (!isOwner) {
            var shareRecord = fileShareRepository.findByFile_IdAndSharedWith_Id(fileId, currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Unauthorized access to file!"));

            FileShare share = shareRecord;
            if ("view".equalsIgnoreCase(action)) {
                if (share.getMaxViews() != null) {
                    if (share.getMaxViews() <= 0) throw new RuntimeException("View limit reached.");
                    share.setMaxViews(share.getMaxViews() - 1);
                }
            } else {
                if (share.getMaxDownloads() != null) {
                    if (share.getMaxDownloads() <= 0) throw new RuntimeException("Download limit reached.");
                    share.setMaxDownloads(share.getMaxDownloads() - 1);
                }
            }
            fileShareRepository.save(share);
        }

        // Return the file from S3
        try {
            java.io.InputStream s3Stream = s3StorageService.downloadFile(fileEntity.getFilePath(), null);
            return new InputStreamResource(s3Stream);
        } catch (Exception e) {
            throw new RuntimeException("Error reading file from S3: " + e.getMessage());
        }
    }

    public void deleteSecureFile(Integer fileId, User currentUser) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        if (!fileEntity.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized attempt to delete file!");
        }

        String filePath = fileEntity.getFilePath();

        transactionTemplate.execute(status -> {
            // Bulletproof Cleanup: Explicitly delete all related records with Foreign Keys
            fileVersionRepository.deleteByFile_Id(fileEntity.getId());
            fileShareRepository.deleteByFile_Id(fileEntity.getId());
            fileRepository.delete(fileEntity);
            return null;
        });

        // Deduplication safety check: Only delete from S3 if no other DB records point to this file
        long referencesLeft = fileRepository.countByFilePath(filePath);
        if (referencesLeft == 0) {
            try {
                s3StorageService.deleteFile(filePath);
            } catch (Exception e) {
                System.err.println("Failed to delete physical file from S3: " + e.getMessage());
                e.printStackTrace(); // Print full stack trace for AWS blocking errors
                throw new RuntimeException("Could not delete file from S3: " + e.getMessage());
            }
        }
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

        file.setIsDeleted(true);
        file.setDeletedAt(LocalDateTime.now());
        fileRepository.save(file);
    }

    public void restoreFile(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can restore this file.");
        }

        file.setIsDeleted(false);
        file.setDeletedAt(null);
        fileRepository.save(file);
    }

    public void permanentlyDelete(Integer fileId, User owner) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can delete this file.");
        }

        String filePath = file.getFilePath();

        transactionTemplate.execute(status -> {
            // Bulletproof Cleanup: Delete dependencies first to avoid foreign key constraint violations
            fileVersionRepository.deleteByFile_Id(file.getId());
            fileShareRepository.deleteByFile_Id(file.getId());
            fileRepository.delete(file);
            return null;
        });
        
        // Deduplication safety check: Only delete from S3 if no other DB records point to this file
        long referencesLeft = fileRepository.countByFilePath(filePath);
        if (referencesLeft == 0) {
            try {
                s3StorageService.deleteFile(filePath);
            } catch (Exception e) {
                System.err.println("Failed to delete physical file from S3: " + e.getMessage());
                e.printStackTrace(); // Print full stack trace for AWS blocking errors
                throw new RuntimeException("Could not delete file from S3: " + e.getMessage());
            }
        }
    }

    public void emptyTrash(User owner) {
        List<FileEntity> trashFiles = fileRepository.findAllByOwnerAndIsDeletedTrue(owner);
        
        transactionTemplate.execute(status -> {
            for (FileEntity file : trashFiles) {
                // Bulletproof Cleanup: Delete dependencies first to avoid foreign key constraint violations
                fileVersionRepository.deleteByFile_Id(file.getId());
                fileShareRepository.deleteByFile_Id(file.getId());
            }
            fileRepository.deleteAll(trashFiles);
            return null;
        });

        for (FileEntity file : trashFiles) {
            long referencesLeft = fileRepository.countByFilePath(file.getFilePath());
            if (referencesLeft == 0) {
                try {
                    s3StorageService.deleteFile(file.getFilePath());
                } catch (Exception e) {
                    System.err.println("Failed to delete physical file from S3: " + e.getMessage());
                    e.printStackTrace(); // Print full stack trace for AWS blocking errors
                    throw new RuntimeException("Could not delete file from S3: " + e.getMessage());
                }
            }
        }
    }

    // --- DEDUPLICATION BACKUP LOGIC ---
    @Transactional
    public FileEntity backupFile(Integer fileId, User currentUser) {
        FileEntity original = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!original.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the owner can backup this file.");
        }

        FileEntity backup = FileEntity.builder()
                .originalName(original.getOriginalName())
                .fileType(original.getFileType())
                .sizeBytes(original.getSizeBytes())
                .compressed(original.getCompressed())
                .virusScanStatus(original.getVirusScanStatus())
                .encryptedFileKey(original.getEncryptedFileKey())
                .iv(original.getIv())
                .filePath(original.getFilePath()) // DEDUPLICATION: Point to the same physical file
                .owner(currentUser)
                .uploadedAt(LocalDateTime.now())
                .isDeleted(false)
                .isBackup(true) // Mark as a backup vault file
                .currentDownloads(0)
                .currentViews(0)
                .maxDownloads(original.getMaxDownloads())
                .maxViews(original.getMaxViews())
                .build();

        return fileRepository.save(backup);
    }

    public List<FileResponse> getBackupFiles(User owner) {
        List<FileEntity> backupFiles = fileRepository.findAllByOwnerAndIsBackupTrueAndIsDeletedFalse(owner);
        return backupFiles.stream().map(file -> FileResponse.builder()
                .id(file.getId())
                .name(file.getOriginalName())
                .fileType(file.getFileType())
                .sizeBytes(file.getSizeBytes())
                .compressed(file.getCompressed())
                .virusScan(file.getVirusScanStatus())
                .uploadedAt(file.getUploadedAt())
                .encryptedFileKey(file.getEncryptedFileKey())
                .iv(file.getIv())
                .folderId(null)
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void restoreBackup(Integer fileId, User owner) {
        FileEntity backupRecord = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!backupRecord.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Only the owner can restore this backup.");
        }

        if (!backupRecord.getIsBackup()) {
            throw new RuntimeException("This file is not a backup.");
        }

        // True Snapshot: Create a new active file record pointing to the same AWS S3 object
        FileEntity restoredFile = FileEntity.builder()
                .originalName(backupRecord.getOriginalName())
                .fileType(backupRecord.getFileType())
                .sizeBytes(backupRecord.getSizeBytes())
                .compressed(backupRecord.getCompressed())
                .virusScanStatus(backupRecord.getVirusScanStatus())
                .encryptedFileKey(backupRecord.getEncryptedFileKey())
                .iv(backupRecord.getIv())
                .filePath(backupRecord.getFilePath()) 
                .group(backupRecord.getGroup())
                .parentFolder(backupRecord.getParentFolder())
                .owner(owner)
                .isDeleted(false) 
                .isBackup(false)  
                .maxDownloads(backupRecord.getMaxDownloads())
                .currentDownloads(0)
                .maxViews(backupRecord.getMaxViews())
                .currentViews(0)
                .uploadedAt(LocalDateTime.now())
                .build();

        fileRepository.save(restoredFile);
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

        notificationService.createNotification(receiver, sender.getFullName() + " shared a file with you: " + file.getOriginalName());
        
        // Push real-time SSE notification
        sseService.notifyUser(receiver.getSearchTag(), receivedLog);
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
        long totalFiles = fileRepository.countByOwnerIdAndIsDeletedFalseAndIsBackupFalse(currentUser.getId());
        long storageUsed = fileRepository.sumSizeByOwnerIdAndIsDeletedFalseAndIsBackupFalse(currentUser.getId());
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

    // --- ZERO-KNOWLEDGE VERSIONING ---
    public List<FileVersion> getFileVersions(Integer fileId, User currentUser) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));
        
        if (!file.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Only the owner can view file version history.");
        }
        
        return fileVersionRepository.findByFile_IdOrderByUploadedAtDesc(fileId);
    }

    public Resource downloadFileVersion(Integer fileId, String versionId, User currentUser) {
        FileEntity fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found!"));

        if (!fileEntity.getOwner().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized attempt to download file version.");
        }

        try {
            java.io.InputStream s3Stream = s3StorageService.downloadFile(fileEntity.getFilePath(), versionId);
            return new InputStreamResource(s3Stream);
        } catch (Exception e) {
            throw new RuntimeException("Error reading file version from S3: " + e.getMessage());
        }
    }
}