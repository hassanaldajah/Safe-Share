package com.motasem.safeshare.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import software.amazon.awssdk.auth.credentials.AnonymousCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * Amazon S3 is optional. It is used for file storage only when {@code storage.type=s3}, and for
 * profile pictures and backups. Without AWS keys the app still starts; only those S3 features fail.
 */
@Configuration
public class S3Config {

    @Value("${aws.accessKeyId:}")
    private String accessKey;

    @Value("${aws.secretKey:}")
    private String secretKey;

    @Value("${aws.region:eu-west-2}")
    private String region;

    @Bean
    @Primary
    public S3Client s3Client() {
        AwsCredentialsProvider credentials = (accessKey.isBlank() || secretKey.isBlank())
                ? AnonymousCredentialsProvider.create()
                : StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));

        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials)
                .build();
    }
}
