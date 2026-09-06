package com.roommate.expense.repository;

import com.roommate.expense.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findByHouseholdIdOrderByCreatedAtDesc(Long householdId, Pageable pageable);
    List<ActivityLog> findTop20ByHouseholdIdOrderByCreatedAtDesc(Long householdId);
}
