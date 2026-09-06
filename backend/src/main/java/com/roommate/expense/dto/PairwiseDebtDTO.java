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
public class PairwiseDebtDTO {
    private Long fromUserId;
    private String fromUserName;
    private String fromUserEmail;
    private Long toUserId;
    private String toUserName;
    private String toUserEmail;
    private BigDecimal amount;
}
