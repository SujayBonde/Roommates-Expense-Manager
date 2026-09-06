package com.roommate.expense.repository;

import com.roommate.expense.entity.HouseholdMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdMemberRepository extends JpaRepository<HouseholdMember, Long> {
    List<HouseholdMember> findByHouseholdId(Long householdId);
    Optional<HouseholdMember> findByHouseholdIdAndUserId(Long householdId, Long userId);
    boolean existsByHouseholdIdAndUserId(Long householdId, Long userId);
    void deleteByHouseholdIdAndUserId(Long householdId, Long userId);
}
