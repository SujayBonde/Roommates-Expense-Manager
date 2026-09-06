package com.roommate.expense.repository;

import com.roommate.expense.entity.Expense;
import com.roommate.expense.enums.CategoryType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {
    List<Expense> findByHouseholdIdOrderByExpenseDateDescCreatedAtDesc(Long householdId);

    List<Expense> findByHouseholdIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            Long householdId, LocalDate startDate, LocalDate endDate);

    List<Expense> findByHouseholdIdAndPaidById(Long householdId, Long userId);
}
