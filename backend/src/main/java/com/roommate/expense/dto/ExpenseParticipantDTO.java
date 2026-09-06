package com.roommate.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseParticipantDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private BigDecimal shareAmount;
    private BigDecimal paidAmount;
    private BigDecimal netBalance;
    private BigDecimal shareValue;
    private boolean isPaid;
}
