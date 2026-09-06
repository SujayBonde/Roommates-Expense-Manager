package com.roommate.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdResponse {
    private Long id;
    private String name;
    private String description;
    private String inviteCode;
    private Long createdById;
    private String createdByName;
    private int membersCount;
    private List<MemberResponse> members;
    private LocalDateTime createdAt;
}
