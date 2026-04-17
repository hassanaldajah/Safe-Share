package com.motasem.safeshare.repository;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {

    List<FileEntity> findAllByOwnerId(Integer ownerId);

    List<FileEntity> findAllByOwnerAndIsDeletedFalse(User owner);
    // 1. Finds private files (Group is NULL)
    java.util.List<FileEntity> findAllByOwnerAndGroupIsNullAndIsDeletedFalse(com.motasem.safeshare.model.User owner);

    // 2. Finds group files
    java.util.List<FileEntity> findAllByGroupAndIsDeletedFalse(com.motasem.safeshare.model.GroupEntity group);
    List<FileEntity> findAllByOwnerAndIsDeletedTrue(User owner);
}