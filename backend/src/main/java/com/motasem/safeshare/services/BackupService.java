package com.motasem.safeshare.services;

import com.motasem.safeshare.model.BackupJob;
import com.motasem.safeshare.repository.BackupJobRepository;
import com.motasem.safeshare.repository.FileRepository;
import com.motasem.safeshare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class BackupService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final BackupJobRepository backupJobRepository;
    private final S3Client s3Client;
    private final String bucketName;

    public BackupService(UserRepository userRepository,
                         FileRepository fileRepository,
                         BackupJobRepository backupJobRepository,
                         S3Client s3Client,
                         @Value("${aws.s3.bucket.files:safeshare-files}") String bucketName) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.backupJobRepository = backupJobRepository;
        this.s3Client = s3Client;
        this.bucketName = bucketName;
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
            
            String jsonContent = String.format(
                "{\n  \"timestamp\": \"%s\",\n  \"ownerEmail\": \"%s\",\n  \"totalFiles\": %d\n}",
                timestamp, currentUser.getEmail(), totalFiles
            );
            
            byte[] bytes = jsonContent.getBytes(StandardCharsets.UTF_8);
            String s3Key = "backups/system-backup-" + timestamp.replace(":", "-") + ".json";
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("application/json")
                    .build();
                    
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
            
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
            e.printStackTrace(); // Log the exact error to the Docker logs
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
