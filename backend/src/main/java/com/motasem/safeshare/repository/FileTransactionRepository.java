package com.motasem.safeshare.repository;

import com.motasem.safeshare.transaction.FileTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// Notice the 'String' here to match your UUID!
public interface FileTransactionRepository extends JpaRepository<FileTransaction, String> {

    // Fetch only records where this user is the owner
    List<FileTransaction> findAllByOwner_SearchTagOrderByTimestampDesc(String ownerSearchTag);
}