package com.motasem.safeshare.repository;
import com.motasem.safeshare.model.User;
import com.motasem.safeshare.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {

    List<FileEntity> findAllByOwnerId(Integer ownerId);

    List<FileEntity> findAllByOwnerAndIsDeletedFalse(User owner);

    List<FileEntity> findAllByOwnerAndIsDeletedTrue(User owner);
}