package com.motasem.safeshare.services;

import com.motasem.safeshare.model.StoredBlob;
import com.motasem.safeshare.repository.StoredBlobRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DatabaseStorageServiceTest {

    private final StoredBlobRepository repository = mock(StoredBlobRepository.class);
    private final DatabaseStorageService storage = new DatabaseStorageService(repository);
    private final byte[] ciphertext = "ciphertext".getBytes(StandardCharsets.UTF_8);

    @Test
    void savesTheBlobUnderItsKey() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "x.enc", "application/octet-stream", ciphertext);

        String version = storage.uploadFile("a.enc", file);

        ArgumentCaptor<StoredBlob> saved = ArgumentCaptor.forClass(StoredBlob.class);
        verify(repository).save(saved.capture());
        assertEquals("a.enc", saved.getValue().getStorageKey());
        assertArrayEquals(ciphertext, saved.getValue().getData());
        assertNotNull(version);
    }

    @Test
    void readsABlobBack() throws Exception {
        when(repository.findById("a.enc")).thenReturn(Optional.of(new StoredBlob("a.enc", ciphertext, Instant.now())));

        try (InputStream in = storage.downloadFile("a.enc", null)) {
            assertArrayEquals(ciphertext, in.readAllBytes());
        }
    }

    @Test
    void aMissingBlobIsAnError() {
        when(repository.findById("missing.enc")).thenReturn(Optional.empty());

        assertThrows(UncheckedIOException.class, () -> storage.downloadFile("missing.enc", null));
    }

    @Test
    void deletingRemovesTheBlob() {
        storage.deleteFile("a.enc");

        verify(repository).deleteById("a.enc");
    }
}
