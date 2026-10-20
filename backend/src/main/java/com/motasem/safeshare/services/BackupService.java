package com.motasem.safeshare.services;

import lombok.extern.slf4j.Slf4j;
import com.motasem.safeshare.model.BackupJob;
import com.motasem.safeshare.repository.BackupJobRepository;
import com.motasem.safeshare.repository.FileRepository;
import com.motasem.safeshare.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class BackupService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final BackupJobRepository backupJobRepository;

    public BackupService(UserRepository userRepository,
                         FileRepository fileRepository,
                         BackupJobRepository backupJobRepository) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.backupJobRepository = backupJobRepository;
    }

    public Map<String, Object> generateSystemBackup(com.motasem.safeshare.model.User currentUser) {
        LocalDateTime startTime = LocalDateTime.now();
        String timestamp = startTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        BackupJob job = BackupJob.builder()
                .name("Vault Backup - " + startTime.toLocalDate().toString())
                .type("full")
                .status("in-progress")
                .startTime(startTime)
                .includesTrash(true)
                .user(currentUser)
                .build();
        job = backupJobRepository.save(job);

        try {
            var myFiles = fileRepository.findAllByOwnerId(currentUser.getId());
            long totalFiles = myFiles.size();
            long totalSizeBytes = myFiles.stream().mapToLong(f -> f.getSizeBytes() != null ? f.getSizeBytes() : 0L).sum();
            
            job.setEndTime(LocalDateTime.now());
            job.setStatus("completed");
            job.setSize(formatSize(totalSizeBytes));
            job.setFilesCount((int) totalFiles);
            backupJobRepository.save(job);

            Map<String, Object> result = new HashMap<>();
            result.put("timestamp", timestamp);
            result.put("size", formatSize(totalSizeBytes));
            result.put("filesCount", totalFiles);
            return result;
        } catch (Exception e) {
            log.error("Backup job failed", e);
            job.setStatus("failed");
            job.setEndTime(LocalDateTime.now());
            backupJobRepository.save(job);
            throw new RuntimeException("Backup failed: " + e.getMessage(), e);
        }
    }
    
    private String formatSize(long sizeInBytes) {
        if (sizeInBytes < 1024) return sizeInBytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(sizeInBytes)) / 10;
        return String.format("%.1f %sB", (double)sizeInBytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }

    public java.util.List<BackupJob> getBackupHistory(com.motasem.safeshare.model.User currentUser) {
        return backupJobRepository.findAllByUserOrderByStartTimeDesc(currentUser);
    }

    public Map<String, Object> getBackupInfo(com.motasem.safeshare.model.User currentUser) {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
        ZonedDateTime nextRun = now.withHour(2).withMinute(0).withSecond(0).withNano(0);
        
        if (now.compareTo(nextRun) >= 0) {
            nextRun = nextRun.plusDays(1);
        }

        Map<String, Object> info = new HashMap<>();
        info.put("nextScheduledBackup", nextRun.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        
        var myFiles = fileRepository.findAllByOwnerId(currentUser.getId());
        long totalSizeBytes = myFiles.stream().mapToLong(f -> f.getSizeBytes() != null ? f.getSizeBytes() : 0L).sum();
        info.put("totalStorageSize", formatSize(totalSizeBytes));
        
        return info;
    }
}
