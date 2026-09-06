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
public class SettlementResponse {
    private Long id;
    private Long payerId;
    private String payerName;
    private String payerEmail;
    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private Long householdId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private String note;
    private LocalDateTime createdAt;
}
