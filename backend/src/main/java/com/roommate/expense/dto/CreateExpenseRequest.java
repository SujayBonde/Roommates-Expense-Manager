package com.roommate.expense.dto;

import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.enums.SplitType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {

    @NotBlank(message = "Expense title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Split type is required")
    private SplitType splitType;

    @NotNull(message = "Category is required")
    private CategoryType category;

    @NotNull(message = "Paid-by user ID is required")
    private Long paidById;

    @NotNull(message = "Household ID is required")
    private Long householdId;

    private LocalDate expenseDate;

    @NotEmpty(message = "At least one participant must be included")
    private List<ParticipantShareDTO> participants;
}
