package com.roommate.expense.repository;

import com.roommate.expense.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    List<Settlement> findByHouseholdIdOrderByPaymentDateDescCreatedAtDesc(Long householdId);
    List<Settlement> findByHouseholdIdAndPaymentDateBetweenOrderByPaymentDateDesc(
            Long householdId, LocalDate startDate, LocalDate endDate);
    List<Settlement> findByHouseholdIdAndPayerIdOrHouseholdIdAndReceiverId(
            Long h1, Long payerId, Long h2, Long receiverId);
}
