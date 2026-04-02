package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.FileShare;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FileShareRepository extends JpaRepository<FileShare, Integer> {

    // Find all files that have been shared WITH a specific user
    List<FileShare> findAllBySharedWithId(Integer userId);

    // Check if a specific user already has access to a specific file
    Optional<FileShare> findByFileIdAndSharedWithId(Integer fileId, Integer sharedWithId);
}