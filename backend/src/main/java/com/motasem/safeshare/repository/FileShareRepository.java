package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.FileShare;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FileShareRepository extends JpaRepository<FileShare, Integer> {

    // Finds all files shared with a specific user
    List<FileShare> findAllBySharedWith_Id(Integer userId);
    List<FileShare> findAllByFile_Id(Integer fileId);
    // ADD THIS NEW LINE: Checks if a specific file is shared with a specific user
    Optional<FileShare> findByFile_IdAndSharedWith_Id(Integer fileId, Integer sharedWithId);

    void deleteByFile_Id(Integer fileId);

    // YOU NEED THESE TWO LINES FOR THE DASHBOARD:
    long countBySharedBy(String sharedByTag);
    long countBySharedWith_Id(Integer userId);
}