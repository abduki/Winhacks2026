package com.financial.backend.controller;

import com.financial.backend.models.Goal;
import com.financial.backend.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {
    private final GoalRepository repository;

    @GetMapping
    public List<Goal> getAllGoals() {
        return repository.findAll();
    }

    @PostMapping
    public Goal createGoal(@RequestBody Goal goal) {
        return repository.save(goal);
    }
}