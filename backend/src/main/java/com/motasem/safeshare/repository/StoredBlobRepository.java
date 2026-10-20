package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.StoredBlob;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredBlobRepository extends JpaRepository<StoredBlob, String> {
}
