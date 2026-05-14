package com.motasem.safeshare.repository;

import com.motasem.safeshare.model.BackupJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.motasem.safeshare.model.User;

@Repository
public interface BackupJobRepository extends JpaRepository<BackupJob, Long> {
    List<BackupJob> findAllByOrderByStartTimeDesc();
    List<BackupJob> findAllByUserOrderByStartTimeDesc(User user);
}
