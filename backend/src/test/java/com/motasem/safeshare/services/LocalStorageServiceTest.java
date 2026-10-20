package com.motasem.safeshare.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LocalStorageServiceTest {

    @TempDir
    Path dir;

    private MockMultipartFile blob(String content) {
        return new MockMultipartFile("file", "x.enc", "application/octet-stream",
                content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void storesReadsAndDeletesAFile() throws Exception {
        LocalStorageService storage = new LocalStorageService(dir.toString());

        assertNotNull(storage.uploadFile("a.enc", blob("ciphertext")));
        try (InputStream in = storage.downloadFile("a.enc", null)) {
            assertEquals("ciphertext", new String(in.readAllBytes(), StandardCharsets.UTF_8));
        }

        storage.deleteFile("a.enc");
        assertFalse(Files.exists(dir.resolve("a.enc")));
    }

    @Test
    void refusesKeysThatEscapeTheStorageFolder() throws Exception {
        LocalStorageService storage = new LocalStorageService(dir.toString());

        assertThrows(IllegalArgumentException.class, () -> storage.uploadFile("../evil.enc", blob("x")));
        assertThrows(IllegalArgumentException.class, () -> storage.downloadFile("../../etc/passwd", null));
        assertThrows(IllegalArgumentException.class, () -> storage.deleteFile("../keep.enc"));
    }

    @Test
    void readingAMissingFileIsAnError() throws Exception {
        LocalStorageService storage = new LocalStorageService(dir.toString());

        assertThrows(UncheckedIOException.class, () -> storage.downloadFile("missing.enc", null));
    }
}
