package com.roommate.expense.dto;

import com.roommate.expense.enums.LoanStatus;
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
public class LoanResponse {
    private Long id;
    private Long lenderId;
    private String lenderName;
    private String lenderEmail;
    private Long borrowerId;
    private String borrowerName;
    private String borrowerEmail;
    private Long householdId;
    private BigDecimal originalAmount;
    private BigDecimal remainingAmount;
    private BigDecimal paidAmount;
    private String description;
    private LocalDate date;
    private LoanStatus status;
    private List<LoanPaymentResponse> payments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
