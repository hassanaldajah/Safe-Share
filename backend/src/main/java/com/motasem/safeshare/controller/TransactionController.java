package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
// --- FIXED: Added the missing imports so it knows where to look! ---
import com.motasem.safeshare.services.TransactionService;
import com.motasem.safeshare.transaction.FileTransactionDTO;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<FileTransactionDTO>> getMyTransactions(
            @AuthenticationPrincipal User currentUser) {

        // We pass the logged-in user's @searchTag to fetch their specific audit log
        List<FileTransactionDTO> transactions = transactionService.getTransactionsForUser(currentUser.getSearchTag());
        return ResponseEntity.ok(transactions);
    }
}