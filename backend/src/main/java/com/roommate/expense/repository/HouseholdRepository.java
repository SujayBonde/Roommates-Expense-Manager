package com.roommate.expense.repository;

import com.roommate.expense.entity.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {
    Optional<Household> findByInviteCode(String inviteCode);
    boolean existsByInviteCode(String inviteCode);

    @Query("SELECT h FROM Household h JOIN h.members m WHERE m.user.id = :userId")
    List<Household> findHouseholdsByUserId(@Param("userId") Long userId);
}
