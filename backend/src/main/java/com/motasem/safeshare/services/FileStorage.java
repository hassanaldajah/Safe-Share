package com.motasem.safeshare.services;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * Where the (already encrypted) file blobs are kept. The server never sees plaintext.
 * Choose the implementation with {@code storage.type}: {@code local} (default) or {@code database}.
 */
public interface FileStorage {

    /** Stores the blob under {@code key} and returns a version id (opaque, may be null). */
    String uploadFile(String key, MultipartFile file) throws IOException;

    /** Opens the blob. {@code versionId} may be null for the latest version. */
    InputStream downloadFile(String key, String versionId);

    void deleteFile(String key);
}
