package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Integer> {
    // We will use this later to fetch a user's dashboard!
    List<FileEntity> findAllByOwnerId(Integer ownerId);
}