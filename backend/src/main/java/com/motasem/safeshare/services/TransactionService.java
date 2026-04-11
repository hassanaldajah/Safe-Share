package com.motasem.safeshare.services;

import com.motasem.safeshare.repository.FileTransactionRepository;
import com.motasem.safeshare.transaction.FileTransactionDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TransactionService {

    private final FileTransactionRepository repository;

    public TransactionService(FileTransactionRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns all transactions (sent + received) for the given user tag,
     * mapped to their DTO representation.
     */
    public List<FileTransactionDTO> getTransactionsForUser(String userTag) {
        // THE FIX: Only fetch records where THIS user is the explicit owner!
        return repository.findAllByOwner_SearchTagOrderByTimestampDesc(userTag)
                .stream()
                .map(FileTransactionDTO::from)
                .toList();
    }
}