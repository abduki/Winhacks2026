package com.financial.backend.models;

import org.springframework.data.annotation.Id;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Group {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    @OneToMany(mappedBy = "group")
    private List<User> members; // All users in this trip/family
}