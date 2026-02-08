package com.financial.backend.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g., "Japan Trip 2026"
    private Double targetAmount;
    private Double currentAmount;

    @OneToOne // One goal per group for simplicity in a hackathon
    @JoinColumn(name = "group_id")
    private Group group;

    public double getProgressPercentage() {
        if (targetAmount == 0)
            return 0;
        return (currentAmount / targetAmount) * 100;
    }
}
