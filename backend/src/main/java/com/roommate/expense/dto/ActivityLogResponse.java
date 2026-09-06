package com.roommate.expense.dto;

import com.roommate.expense.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogResponse {
    private Long id;
    private Long householdId;
    private Long userId;
    private String userName;
    private ActivityType activityType;
    private String description;
    private LocalDateTime createdAt;
}
