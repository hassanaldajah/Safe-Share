package com.motasem.safeshare.repository;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {

    List<FileEntity> findAllByOwnerId(Integer ownerId);

    List<FileEntity> findAllByOwnerAndIsDeletedFalse(User owner);
    // 1. Finds private files in root directory (Group is NULL and Folder is NULL)
    java.util.List<FileEntity> findAllByOwnerAndGroupIsNullAndParentFolderIsNullAndIsDeletedFalseAndIsBackupFalse(com.motasem.safeshare.model.User owner);

    // 1b. Finds private files inside a specific folder
    java.util.List<FileEntity> findAllByOwnerAndGroupIsNullAndParentFolderIdAndIsDeletedFalseAndIsBackupFalse(com.motasem.safeshare.model.User owner, Integer parentFolderId);

    // 1c. Finds ALL private files for a user (no matter what folder, but not in groups)
    java.util.List<FileEntity> findAllByOwnerAndGroupIsNullAndIsDeletedFalseAndIsBackupFalse(com.motasem.safeshare.model.User owner);

    // 1d. Finds ALL backup files for a user
    java.util.List<FileEntity> findAllByOwnerAndIsBackupTrueAndIsDeletedFalse(com.motasem.safeshare.model.User owner);

    // 1e. Count files by filePath to ensure safe deletion
    long countByFilePath(String filePath);

    // 2. Finds group files
    java.util.List<FileEntity> findAllByGroupAndIsDeletedFalse(com.motasem.safeshare.model.GroupEntity group);
    List<FileEntity> findAllByOwnerAndIsDeletedTrue(User owner);

    List<FileEntity> findAllByGroup(com.motasem.safeshare.model.GroupEntity group);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(f.sizeBytes) FROM FileEntity f")
    Long sumAllFileSizes();
}