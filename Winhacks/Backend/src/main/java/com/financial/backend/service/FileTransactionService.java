package com.financial.backend.service; 

import java.util.List;

import com.financial.backend.models.Transaction;
import com.financial.backend.repository.TransactionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FileTransactionService {

    private final TransactionRepository repository;

    public List<Transaction> getAll() {
        return repository.findAll();
    }

    public void add(Transaction t) {
        repository.save(t);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public Transaction edit(Long id, Transaction t) {
        return repository.findById(id)
            .map(existing -> {
                if (t.getDescription() != null) existing.setDescription(t.getDescription());
                if (t.getAmount() != null) existing.setAmount(t.getAmount());
                if (t.getCategory() != null) existing.setCategory(t.getCategory());
                if (t.getDate() != null) existing.setDate(t.getDate());
                if (t.getUser() != null) existing.setUser(t.getUser());
                
                return repository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));
    }

    @Transactional
    public void importJson(String json) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); 
        
        List<Transaction> transactions = mapper.readValue(
            json, 
            mapper.getTypeFactory().constructCollectionType(List.class, Transaction.class)
        );
        repository.saveAll(transactions);
    }
}