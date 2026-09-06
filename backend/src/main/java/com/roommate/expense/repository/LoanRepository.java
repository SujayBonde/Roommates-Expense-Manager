package com.roommate.expense.repository;

import com.roommate.expense.entity.Loan;
import com.roommate.expense.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByHouseholdIdOrderByCreatedAtDesc(Long householdId);
    List<Loan> findByHouseholdIdAndStatusOrderByCreatedAtDesc(Long householdId, LoanStatus status);
    List<Loan> findByHouseholdIdAndLenderIdOrHouseholdIdAndBorrowerId(
            Long h1, Long lenderId, Long h2, Long borrowerId);
}
