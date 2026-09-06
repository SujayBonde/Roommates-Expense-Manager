package com.roommate.expense.repository;

import com.roommate.expense.entity.LoanPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanPaymentRepository extends JpaRepository<LoanPayment, Long> {
    List<LoanPayment> findByLoanIdOrderByPaymentDateDescCreatedAtDesc(Long loanId);
}
