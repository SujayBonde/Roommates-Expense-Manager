package com.roommate.expense.util;

import com.roommate.expense.dto.PairwiseDebtDTO;
import com.roommate.expense.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class MinimumSettlementCalculatorTest {

    private MinimumSettlementCalculator calculator;
    private Map<Long, User> userMap;

    @BeforeEach
    void setUp() {
        calculator = new MinimumSettlementCalculator();
        userMap = new HashMap<>();
        userMap.put(1L, User.builder().id(1L).name("Rahul").email("rahul@example.com").build());
        userMap.put(2L, User.builder().id(2L).name("Amit").email("amit@example.com").build());
        userMap.put(3L, User.builder().id(3L).name("Akash").email("akash@example.com").build());
        userMap.put(4L, User.builder().id(4L).name("Sagar").email("sagar@example.com").build());
    }

    @Test
    void testStandardPromptScenario() {
        // Rahul: +3000, Amit: -1000, Akash: -1000, Sagar: -1000
        Map<Long, BigDecimal> netBalances = new HashMap<>();
        netBalances.put(1L, new BigDecimal("3000.00"));
        netBalances.put(2L, new BigDecimal("-1000.00"));
        netBalances.put(3L, new BigDecimal("-1000.00"));
        netBalances.put(4L, new BigDecimal("-1000.00"));

        List<PairwiseDebtDTO> settlements = calculator.calculateMinimumSettlements(netBalances, userMap);

        assertEquals(3, settlements.size());

        // Verify total settled matches total positive balances
        BigDecimal totalSettled = settlements.stream()
                .map(PairwiseDebtDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("3000.00"), totalSettled);

        // All debts should go to Rahul (id 1)
        for (PairwiseDebtDTO s : settlements) {
            assertEquals(1L, s.getToUserId());
            assertEquals(new BigDecimal("1000.00"), s.getAmount());
        }
    }

    @Test
    void testComplexScenario() {
        // Rahul: +5000, Amit: +2000, Akash: -4000, Sagar: -3000
        Map<Long, BigDecimal> netBalances = new HashMap<>();
        netBalances.put(1L, new BigDecimal("5000.00"));
        netBalances.put(2L, new BigDecimal("2000.00"));
        netBalances.put(3L, new BigDecimal("-4000.00"));
        netBalances.put(4L, new BigDecimal("-3000.00"));

        List<PairwiseDebtDTO> settlements = calculator.calculateMinimumSettlements(netBalances, userMap);

        // Max 3 transactions needed to settle 4 people
        assertTrue(settlements.size() <= 3);

        BigDecimal totalSettled = settlements.stream()
                .map(PairwiseDebtDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("7000.00"), totalSettled);
    }
}
