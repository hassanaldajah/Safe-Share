package com.motasem.safeshare.services;

import com.motasem.safeshare.repository.FileRepository;
import com.motasem.safeshare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
public class BackupService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final S3Client s3Client;
    private final String bucketName;

    public BackupService(UserRepository userRepository,
                         FileRepository fileRepository,
                         S3Client s3Client,
                         @Value("${aws.s3.bucket.files:safeshare-files}") String bucketName) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    public Map<String, Object> generateSystemBackup() {
        long totalUsers = userRepository.count();
        long totalFiles = fileRepository.count();
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        
        String jsonContent = String.format(
            "{\n  \"timestamp\": \"%s\",\n  \"totalUsers\": %d,\n  \"totalFiles\": %d\n}",
            timestamp, totalUsers, totalFiles
        );
        
        byte[] bytes = jsonContent.getBytes(StandardCharsets.UTF_8);
        String s3Key = "backups/system-backup-" + timestamp.replace(":", "-") + ".json";
        
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType("application/json")
                .build();
                
        s3Client.putObject(putObjectRequest, RequestBody.fromBytes(bytes));
        
        Map<String, Object> result = new HashMap<>();
        result.put("timestamp", timestamp);
        result.put("size", formatSize(bytes.length));
        result.put("filesCount", totalFiles);
        return result;
    }
    
    private String formatSize(long sizeInBytes) {
        if (sizeInBytes < 1024) return sizeInBytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(sizeInBytes)) / 10;
        return String.format("%.1f %sB", (double)sizeInBytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }
}
