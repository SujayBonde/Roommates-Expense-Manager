package com.roommate.expense.service;

import com.roommate.expense.dto.CreateLoanRequest;
import com.roommate.expense.dto.LoanPaymentRequest;
import com.roommate.expense.dto.LoanPaymentResponse;
import com.roommate.expense.dto.LoanResponse;
import com.roommate.expense.entity.*;
import com.roommate.expense.enums.ActivityType;
import com.roommate.expense.enums.LoanStatus;
import com.roommate.expense.enums.NotificationType;
import com.roommate.expense.exception.BadRequestException;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.exception.ResourceNotFoundException;
import com.roommate.expense.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanPaymentRepository loanPaymentRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request, Long lenderUserId) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        validateMembership(household.getId(), lenderUserId);
        validateMembership(household.getId(), request.getBorrowerId());

        if (lenderUserId.equals(request.getBorrowerId())) {
            throw new BadRequestException("You cannot lend money to yourself");
        }

        User lender = userRepository.findById(lenderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Lender not found"));
        User borrower = userRepository.findById(request.getBorrowerId())
                .orElseThrow(() -> new ResourceNotFoundException("Borrower not found"));

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        Loan loan = Loan.builder()
                .lender(lender)
                .borrower(borrower)
                .household(household)
                .originalAmount(amount)
                .remainingAmount(amount)
                .description(request.getDescription())
                .date(request.getDate() != null ? request.getDate() : LocalDate.now())
                .status(LoanStatus.PENDING)
                .build();

        Loan savedLoan = loanRepository.save(loan);

        activityLogService.logActivity(
                household,
                lender,
                ActivityType.LOAN_CREATED,
                lender.getName() + " lent ₹" + amount + " to " + borrower.getName()
        );

        notificationService.createNotification(
                borrower,
                lender.getName() + " recorded a personal loan of ₹" + amount + " to you",
                NotificationType.LOAN_CREATED,
                savedLoan.getId()
        );

        return mapToResponse(savedLoan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getLoans(Long householdId, LoanStatus status, Long currentUserId) {
        validateMembership(householdId, currentUserId);

        List<Loan> loans = (status != null)
                ? loanRepository.findByHouseholdIdAndStatusOrderByCreatedAtDesc(householdId, status)
                : loanRepository.findByHouseholdIdOrderByCreatedAtDesc(householdId);

        return loans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long id, Long currentUserId) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));

        validateMembership(loan.getHousehold().getId(), currentUserId);
        return mapToResponse(loan);
    }

    @Transactional
    public LoanResponse addLoanPayment(Long loanId, LoanPaymentRequest request, Long currentUserId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        validateMembership(loan.getHousehold().getId(), currentUserId);

        if (loan.getStatus() == LoanStatus.PAID) {
            throw new BadRequestException("This loan has already been fully repaid");
        }

        BigDecimal paymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        if (paymentAmount.compareTo(loan.getRemainingAmount()) > 0) {
            throw new BadRequestException(
                    String.format("Payment amount (₹%s) exceeds remaining debt (₹%s)",
                            paymentAmount, loan.getRemainingAmount()));
        }

        LoanPayment payment = LoanPayment.builder()
                .loan(loan)
                .amount(paymentAmount)
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .note(request.getNote())
                .build();

        loanPaymentRepository.save(payment);

        BigDecimal newRemaining = loan.getRemainingAmount().subtract(paymentAmount).setScale(2, RoundingMode.HALF_UP);
        loan.setRemainingAmount(newRemaining);

        if (newRemaining.compareTo(BigDecimal.ZERO) == 0) {
            loan.setStatus(LoanStatus.PAID);
        } else {
            loan.setStatus(LoanStatus.PARTIALLY_PAID);
        }

        Loan savedLoan = loanRepository.save(loan);

        User payer = userRepository.findById(currentUserId).orElse(loan.getBorrower());

        activityLogService.logActivity(
                loan.getHousehold(),
                payer,
                ActivityType.LOAN_PAYMENT,
                payer.getName() + " paid ₹" + paymentAmount + " towards loan from " + loan.getLender().getName()
        );

        notificationService.createNotification(
                loan.getLender(),
                loan.getBorrower().getName() + " paid ₹" + paymentAmount + " towards the loan (Remaining: ₹" + newRemaining + ")",
                newRemaining.compareTo(BigDecimal.ZERO) == 0 ? NotificationType.LOAN_PAID : NotificationType.LOAN_PAYMENT,
                savedLoan.getId()
        );

        return mapToResponse(savedLoan);
    }

    @Transactional
    public void deleteLoan(Long loanId, Long currentUserId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));

        validateMembership(loan.getHousehold().getId(), currentUserId);

        HouseholdMember member = memberRepository.findByHouseholdIdAndUserId(loan.getHousehold().getId(), currentUserId)
                .orElseThrow(() -> new ForbiddenException("Not a member"));

        if (!loan.getLender().getId().equals(currentUserId) && !member.isAdmin()) {
            throw new ForbiddenException("Only the lender or a household admin can delete this loan");
        }

        loanRepository.delete(loan);
    }

    private void validateMembership(Long householdId, Long userId) {
        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, userId)) {
            throw new ForbiddenException("You do not belong to this household");
        }
    }

    private LoanResponse mapToResponse(Loan loan) {
        BigDecimal paidAmount = loan.getOriginalAmount().subtract(loan.getRemainingAmount())
                .setScale(2, RoundingMode.HALF_UP);

        List<LoanPaymentResponse> payments = loan.getPayments() != null
                ? loan.getPayments().stream().map(p -> LoanPaymentResponse.builder()
                        .id(p.getId())
                        .amount(p.getAmount())
                        .paymentDate(p.getPaymentDate())
                        .note(p.getNote())
                        .createdAt(p.getCreatedAt())
                        .build()).collect(Collectors.toList())
                : List.of();

        return LoanResponse.builder()
                .id(loan.getId())
                .lenderId(loan.getLender().getId())
                .lenderName(loan.getLender().getName())
                .lenderEmail(loan.getLender().getEmail())
                .borrowerId(loan.getBorrower().getId())
                .borrowerName(loan.getBorrower().getName())
                .borrowerEmail(loan.getBorrower().getEmail())
                .householdId(loan.getHousehold().getId())
                .originalAmount(loan.getOriginalAmount())
                .remainingAmount(loan.getRemainingAmount())
                .paidAmount(paidAmount)
                .description(loan.getDescription())
                .date(loan.getDate())
                .status(loan.getStatus())
                .payments(payments)
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .build();
    }
}
