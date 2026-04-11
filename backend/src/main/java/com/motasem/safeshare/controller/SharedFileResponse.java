package com.motasem.safeshare.controller;

import lombok.Builder;
import java.time.LocalDateTime;

@Builder
public record SharedFileResponse(
        Integer fileId,
        String fileName,      // Assuming your FileEntity has a name/title
        String sharedBy,      // The @searchTag of the person who shared it
        String encryptedKey   // The Zero-Knowledge key specifically encrypted for THIS user
) {}