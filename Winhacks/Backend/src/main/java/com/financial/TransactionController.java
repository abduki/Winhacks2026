package com.financial;


import org.h2.mvstore.tx.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.JsonProcessingException;
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private FileTransactionService service;

    @PostMapping
    public void add(@RequestBody Transaction t) {
        service.add(t);
    }

    @PutMapping("/{id}")
    public void edit(@PathVariable Long id, @RequestBody Transaction t) { service.edit(id, t); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { service.delete(id); }

    @PostMapping("/import")
    public void importFile(@RequestBody String json) throws JsonProcessingException { 
        service.importJson(json); 
    }
}