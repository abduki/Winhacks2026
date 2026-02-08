import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data // <--- This generates the getters/setters
@NoArgsConstructor // Necessary for JPA
@AllArgsConstructor // Good practice
public class Transaction {
    private Long id;
    private String description;
    private Double amount;
    private LocalDateTime date;

    // 1. No-Args Constructor (Required for JSON mapping)
    public Transaction() {
    }

    // 2. Parameterized Constructor (Convenience for adding new ones)
    public Transaction(Long id, String description, Double amount, LocalDateTime date) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.date = date;
    }

    // 3. Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }
}