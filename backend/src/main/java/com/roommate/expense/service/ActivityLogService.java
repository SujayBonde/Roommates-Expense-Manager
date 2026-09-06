package com.roommate.expense.service;

import com.roommate.expense.dto.ActivityLogResponse;
import com.roommate.expense.entity.ActivityLog;
import com.roommate.expense.entity.Household;
import com.roommate.expense.entity.User;
import com.roommate.expense.enums.ActivityType;
import com.roommate.expense.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(Household household, User user, ActivityType type, String description) {
        ActivityLog log = ActivityLog.builder()
                .household(household)
                .user(user)
                .activityType(type)
                .description(description)
                .build();
        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getHouseholdActivities(Long householdId, Pageable pageable) {
        return activityLogRepository.findByHouseholdIdOrderByCreatedAtDesc(householdId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentHouseholdActivities(Long householdId) {
        return activityLogRepository.findTop20ByHouseholdIdOrderByCreatedAtDesc(householdId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .householdId(log.getHousehold().getId())
                .userId(log.getUser().getId())
                .userName(log.getUser().getName())
                .activityType(log.getActivityType())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
