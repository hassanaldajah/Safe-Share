package com.motasem.safeshare.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import jakarta.annotation.PostConstruct;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.io.IOException;
import java.io.InputStream;

@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String regionString;

    public S3StorageService(
            S3Client s3Client,
            @Value("${aws.s3.bucket.files:safeshare-files}") String bucketName,
            @Value("${aws.region:eu-west-2}") String regionString) {
        
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.regionString = regionString;
    }

    @PostConstruct
    public void init() {
        System.out.println("S3Client initialized explicitly for region: " + this.regionString);
    }

    public String uploadFile(String key, MultipartFile file) throws IOException {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        PutObjectResponse response = s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        
        return response.versionId();
    }

    public InputStream downloadFile(String key, String awsVersionId) {
        GetObjectRequest.Builder requestBuilder = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key);
                
        if (awsVersionId != null && !awsVersionId.isEmpty()) {
            requestBuilder.versionId(awsVersionId);
        }

        return s3Client.getObject(requestBuilder.build());
    }

    public void deleteFile(String key) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
    }
}
