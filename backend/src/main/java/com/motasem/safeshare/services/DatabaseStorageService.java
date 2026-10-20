package com.motasem.safeshare.services;

import com.motasem.safeshare.model.StoredBlob;
import com.motasem.safeshare.repository.StoredBlobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.UUID;

/**
 * Keeps encrypted blobs in the PostgreSQL database. Use it where the server has no permanent disk
 * (most free hosting), for example with Neon. Each blob is read into memory, so keep uploads modest
 * (MAX_UPLOAD_SIZE). Only one version of each file is kept.
 */
@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "database")
@RequiredArgsConstructor
public class DatabaseStorageService implements FileStorage {

    private final StoredBlobRepository blobs;

    @Override
    @Transactional
    public String uploadFile(String key, MultipartFile file) throws IOException {
        blobs.save(new StoredBlob(key, file.getBytes(), Instant.now()));
        return UUID.randomUUID().toString();
    }

    @Override
    @Transactional(readOnly = true)
    public InputStream downloadFile(String key, String versionId) {
        StoredBlob blob = blobs.findById(key)
                .orElseThrow(() -> new UncheckedIOException(new FileNotFoundException("File not found in storage")));
        return new ByteArrayInputStream(blob.getData());
    }

    @Override
    @Transactional
    public void deleteFile(String key) {
        blobs.deleteById(key);
    }
}
