package com.financial.backend.models;

import org.springframework.data.annotation.Id;

import jakarta.persistence.*;
import lombok.Data;


@Entity
@Table(name = "users")
@Data // Lombok for getters/setters
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String googleId;
    private String name;
    private String email;

    @ManyToOne // Many Users belong to one Group (Family/Trip)
    @JoinColumn(name = "group_id")
    private Group group;
}