package com.motasem.safeshare.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** An encrypted file kept in the database (storage.type=database). The server never sees the plaintext. */
@Entity
@Table(name = "stored_blob")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StoredBlob {

    @Id
    @Column(name = "storage_key", length = 255)
    private String storageKey;

    @Column(name = "data", nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
