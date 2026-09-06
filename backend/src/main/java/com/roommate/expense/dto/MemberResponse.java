package com.roommate.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberResponse {
    private Long id; // HouseholdMember id
    private Long userId;
    private String name;
    private String email;
    private String profileImage;
    private boolean isAdmin;
    private LocalDateTime joinedAt;
}
