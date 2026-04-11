package com.motasem.safeshare.transaction;

import java.time.Instant;

/**
 * Immutable response DTO — keeps JPA internals off the wire.
 */
public record FileTransactionDTO(
        String id,
        String fileId,
        String fileName,
        String senderTag,
        String receiverTag,
        String transactionType,   // "SENT" | "RECEIVED"
        Instant timestamp,
        String status,            // "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
        Long fileSizeBytes
) {
    public static FileTransactionDTO from(FileTransaction entity) {
        return new FileTransactionDTO(
                entity.getId(),
                entity.getFileId(),
                entity.getFileName(),
                entity.getSenderTag(),
                entity.getReceiverTag(),
                entity.getTransactionType().name(),
                entity.getTimestamp(),
                entity.getStatus().name(),
                entity.getFileSizeBytes()
        );
    }
}