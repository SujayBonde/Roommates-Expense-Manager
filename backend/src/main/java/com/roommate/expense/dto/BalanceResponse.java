package com.roommate.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceResponse {
    private Long householdId;
    private String householdName;
    private BigDecimal totalExpenses;
    private BigDecimal myPaid;
    private BigDecimal myShare;
    private BigDecimal myNetBalance;
    private BigDecimal myNeedToPay;
    private BigDecimal myWillReceive;
    private List<MemberBalanceDTO> memberBalances;
}
