package com.roommate.expense.service;

import com.roommate.expense.dto.BalanceResponse;
import com.roommate.expense.dto.MemberBalanceDTO;
import com.roommate.expense.entity.*;
import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.enums.SplitType;
import com.roommate.expense.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BalanceServiceTest {

    @Mock
    private HouseholdRepository householdRepository;

    @Mock
    private HouseholdMemberRepository memberRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseParticipantRepository participantRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @InjectMocks
    private BalanceService balanceService;

    private Household household;
    private User rahul;
    private User amit;
    private HouseholdMember memberRahul;
    private HouseholdMember memberAmit;

    @BeforeEach
    void setUp() {
        rahul = User.builder().id(1L).name("Rahul").email("rahul@example.com").build();
        amit = User.builder().id(2L).name("Amit").email("amit@example.com").build();

        household = Household.builder().id(10L).name("Flat 302").build();
        memberRahul = HouseholdMember.builder().id(101L).household(household).user(rahul).isAdmin(true).build();
        memberAmit = HouseholdMember.builder().id(102L).household(household).user(amit).isAdmin(false).build();
    }

    @Test
    void testCalculateBalancesWithExpensesAndSettlements() {
        when(householdRepository.findById(10L)).thenReturn(Optional.of(household));
        when(memberRepository.existsByHouseholdIdAndUserId(10L, 1L)).thenReturn(true);
        when(memberRepository.findByHouseholdId(10L)).thenReturn(Arrays.asList(memberRahul, memberAmit));

        // Expense: Rahul paid 2000, split 1000 each
        Expense expense = Expense.builder()
                .id(501L)
                .household(household)
                .paidBy(rahul)
                .totalAmount(new BigDecimal("2000.00"))
                .splitType(SplitType.EQUAL)
                .category(CategoryType.GROCERIES)
                .expenseDate(LocalDate.now())
                .build();

        ExpenseParticipant p1 = ExpenseParticipant.builder().expense(expense).user(rahul).shareAmount(new BigDecimal("1000.00")).build();
        ExpenseParticipant p2 = ExpenseParticipant.builder().expense(expense).user(amit).shareAmount(new BigDecimal("1000.00")).build();
        expense.setParticipants(Arrays.asList(p1, p2));

        when(expenseRepository.findByHouseholdIdOrderByExpenseDateDescCreatedAtDesc(10L))
                .thenReturn(Collections.singletonList(expense));

        // Settlement: Amit pays Rahul 400
        Settlement settlement = Settlement.builder()
                .id(601L)
                .household(household)
                .payer(amit)
                .receiver(rahul)
                .amount(new BigDecimal("400.00"))
                .paymentDate(LocalDate.now())
                .build();

        when(settlementRepository.findByHouseholdIdOrderByPaymentDateDescCreatedAtDesc(10L))
                .thenReturn(Collections.singletonList(settlement));

        BalanceResponse response = balanceService.calculateBalances(10L, 1L);

        assertNotNull(response);
        assertEquals(new BigDecimal("2000.00"), response.getTotalExpenses());

        // Rahul: Paid 2000 expense, received 400 settlement. Net = 2000 - (1000 share + 400 received) = +600
        // Amit: Paid 0 expense + 400 settlement. Net = 400 - 1000 share = -600
        MemberBalanceDTO rahulBalance = response.getMemberBalances().stream()
                .filter(b -> b.getUserId().equals(1L)).findFirst().orElseThrow();
        MemberBalanceDTO amitBalance = response.getMemberBalances().stream()
                .filter(b -> b.getUserId().equals(2L)).findFirst().orElseThrow();

        assertEquals(new BigDecimal("600.00"), rahulBalance.getNetBalance());
        assertEquals(new BigDecimal("600.00"), rahulBalance.getShouldReceive());
        assertEquals(new BigDecimal("0.00"), rahulBalance.getShouldPay());

        assertEquals(new BigDecimal("-600.00"), amitBalance.getNetBalance());
        assertEquals(new BigDecimal("0.00"), amitBalance.getShouldReceive());
        assertEquals(new BigDecimal("600.00"), amitBalance.getShouldPay());
    }
}
