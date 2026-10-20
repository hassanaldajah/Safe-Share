package com.motasem.safeshare.services;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Set;

/**
 * Profile pictures are small, so they are stored in the database as a data URL
 * (in the user's profilePictureUrl column). No file storage account is needed.
 * The web app shrinks the photo before uploading it.
 */
@Service
public class ProfilePictureService {

    private static final long MAX_BYTES = 512 * 1024;
    // No SVG on purpose: it can carry scripts
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/webp", "image/gif");

    public String toDataUrl(MultipartFile file) throws IOException {
        String type = file.getContentType();
        if (type == null || !ALLOWED_TYPES.contains(type)) {
            throw new IllegalArgumentException("Please choose a PNG, JPEG, WebP or GIF image.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("The image is too large (maximum 512 KB).");
        }
        return "data:" + type + ";base64," + Base64.getEncoder().encodeToString(file.getBytes());
    }
}
