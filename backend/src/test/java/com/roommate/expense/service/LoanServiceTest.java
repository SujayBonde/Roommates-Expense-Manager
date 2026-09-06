package com.roommate.expense.service;

import com.roommate.expense.dto.CreateLoanRequest;
import com.roommate.expense.dto.LoanPaymentRequest;
import com.roommate.expense.dto.LoanResponse;
import com.roommate.expense.entity.*;
import com.roommate.expense.enums.LoanStatus;
import com.roommate.expense.exception.BadRequestException;
import com.roommate.expense.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private LoanPaymentRepository loanPaymentRepository;

    @Mock
    private HouseholdRepository householdRepository;

    @Mock
    private HouseholdMemberRepository memberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private LoanService loanService;

    private Household household;
    private User rahul;
    private User amit;

    @BeforeEach
    void setUp() {
        rahul = User.builder().id(1L).name("Rahul").email("rahul@example.com").build();
        amit = User.builder().id(2L).name("Amit").email("amit@example.com").build();
        household = Household.builder().id(10L).name("Flat 302").build();
    }

    @Test
    void testCreateLoanSuccess() {
        when(householdRepository.findById(10L)).thenReturn(Optional.of(household));
        when(memberRepository.existsByHouseholdIdAndUserId(10L, 1L)).thenReturn(true);
        when(memberRepository.existsByHouseholdIdAndUserId(10L, 2L)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(rahul));
        when(userRepository.findById(2L)).thenReturn(Optional.of(amit));

        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> {
            Loan l = invocation.getArgument(0);
            l.setId(100L);
            return l;
        });

        CreateLoanRequest request = CreateLoanRequest.builder()
                .borrowerId(2L)
                .amount(new BigDecimal("1000.00"))
                .description("Emergency money")
                .date(LocalDate.now())
                .householdId(10L)
                .build();

        LoanResponse response = loanService.createLoan(request, 1L);

        assertNotNull(response);
        assertEquals(new BigDecimal("1000.00"), response.getOriginalAmount());
        assertEquals(new BigDecimal("1000.00"), response.getRemainingAmount());
        assertEquals(LoanStatus.PENDING, response.getStatus());
    }

    @Test
    void testAddPartialLoanPayment() {
        Loan loan = Loan.builder()
                .id(100L)
                .lender(rahul)
                .borrower(amit)
                .household(household)
                .originalAmount(new BigDecimal("1000.00"))
                .remainingAmount(new BigDecimal("1000.00"))
                .status(LoanStatus.PENDING)
                .build();

        when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));
        when(memberRepository.existsByHouseholdIdAndUserId(10L, 2L)).thenReturn(true);
        when(loanRepository.save(any(Loan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoanPaymentRequest request = LoanPaymentRequest.builder()
                .amount(new BigDecimal("400.00"))
                .paymentDate(LocalDate.now())
                .note("First installment")
                .build();

        LoanResponse response = loanService.addLoanPayment(100L, request, 2L);

        assertEquals(new BigDecimal("600.00"), response.getRemainingAmount());
        assertEquals(new BigDecimal("400.00"), response.getPaidAmount());
        assertEquals(LoanStatus.PARTIALLY_PAID, response.getStatus());
    }

    @Test
    void testAddPaymentExceedsRemaining() {
        Loan loan = Loan.builder()
                .id(100L)
                .lender(rahul)
                .borrower(amit)
                .household(household)
                .originalAmount(new BigDecimal("1000.00"))
                .remainingAmount(new BigDecimal("300.00"))
                .status(LoanStatus.PARTIALLY_PAID)
                .build();

        when(loanRepository.findById(100L)).thenReturn(Optional.of(loan));
        when(memberRepository.existsByHouseholdIdAndUserId(10L, 2L)).thenReturn(true);

        LoanPaymentRequest request = LoanPaymentRequest.builder()
                .amount(new BigDecimal("500.00"))
                .paymentDate(LocalDate.now())
                .build();

        assertThrows(BadRequestException.class, () -> loanService.addLoanPayment(100L, request, 2L));
    }
}
