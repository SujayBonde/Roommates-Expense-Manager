package com.roommate.expense.dto;

import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.enums.SplitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private Long id;
    private String title;
    private String description;
    private BigDecimal amount;
    private SplitType splitType;
    private CategoryType category;
    private Long paidById;
    private String paidByName;
    private String paidByEmail;
    private Long householdId;
    private String householdName;
    private LocalDate expenseDate;
    private List<ExpenseParticipantDTO> participants;
    private BigDecimal myShare;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
