package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.FolderEntity;
import com.motasem.safeshare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<FolderEntity, Integer> {
    List<FolderEntity> findAllByOwnerAndParentFolderIsNull(User owner);
    List<FolderEntity> findAllByOwnerAndParentFolderId(User owner, Integer parentId);
    List<FolderEntity> findAllByOwner(User owner);
    Optional<FolderEntity> findByIdAndOwner(Integer id, User owner);
}
