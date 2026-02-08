package com.financial.backend.controller;

import com.financial.backend.models.Transaction;
import com.financial.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final TransactionRepository transactionRepository;

    @GetMapping("/{groupId}")
    public Map<String, Double> getGroupLeaderboard(@PathVariable Long groupId) {
        // finds all the transactions and ads them up by their user name for a specific group

        return transactionRepository.findAll().stream()
            .filter(t -> t.getUser() != null && t.getUser().getGroup() != null && t.getUser().getGroup().getId().equals(groupId))
            .collect(Collectors.groupingBy(
                t -> t.getUser().getName(),
                Collectors.summingDouble(Transaction::getAmount)
            ));
    }
}