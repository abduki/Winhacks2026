package com.financial.backend.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;
    private String category; // e.g., "Coffee", "Rent"
    private LocalDate date;
    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id") // Links transaction to a specific User
    private User user;
}