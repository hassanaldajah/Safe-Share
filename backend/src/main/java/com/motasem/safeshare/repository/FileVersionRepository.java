package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.FileVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileVersionRepository extends JpaRepository<FileVersion, UUID> {
    List<FileVersion> findByFile_IdOrderByUploadedAtDesc(Integer fileId);
    void deleteByFile_Id(Integer fileId);
}
