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
public class MemberBalanceDTO {
    private Long userId;
    private String name;
    private String email;
    private String profileImage;
    private BigDecimal totalPaid;
    private BigDecimal totalShare;
    private BigDecimal netBalance;
    private BigDecimal shouldReceive;
    private BigDecimal shouldPay;
}
