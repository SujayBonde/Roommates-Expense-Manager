package com.roommate.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanPaymentResponse {
    private Long id;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String note;
    private LocalDateTime createdAt;
}
