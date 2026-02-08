package com.financial;


import java.util.List;

import org.h2.mvstore.tx.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileTransactionService {

    private final TransactionRepository repository;

    // Add & Edit (Save handles both: if ID exists, it updates; if not, it creates)
    public Transaction saveTransaction(Transaction transaction) {
        return repository.save(transaction);
    }

    // Remove
    public void deleteTransaction(Long id) {
        repository.deleteById(id);
    }

    // Import from JSON List
    @Transactional
    public List<Transaction> importTransactions(List<Transaction> transactions) {
        return repository.saveAll(transactions);
    }

    public List<Transaction> getAll() {
        return repository.findAll();
    }

    public void importJson(String json) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'importJson'");
    }

    public Transaction add(Transaction t) {
        return repository.save(t);
    }

    // 2. DELETE: Remove by ID
    public void delete(Long id) {
        repository.deleteById(id);
    }

    // 3. EDIT: Find, Update fields, then Save
    public Transaction edit(Long id, Transaction t) {
        return repository.findById(id)
            .map(existingTransaction -> {
                // Update the fields from 't' into the 'existingTransaction'
                existingTransaction.setDescription(t.getDescription());
                existingTransaction.setAmount(t.getAmount());
                existingTransaction.setTransactionDate(t.getTransactionDate());
                return repository.save(existingTransaction);
            })
            .orElseThrow(() -> new RuntimeException("Transaction not found with id " + id));
    }
}