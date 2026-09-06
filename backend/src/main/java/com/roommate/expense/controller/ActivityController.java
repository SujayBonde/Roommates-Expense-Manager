package com.roommate.expense.controller;

import com.roommate.expense.dto.ActivityLogResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.ActivityLogService;
import com.roommate.expense.service.HouseholdService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityLogService activityLogService;
    private final HouseholdService householdService;

    @GetMapping("/{id}/activities")
    public ResponseEntity<Page<ActivityLogResponse>> getActivities(
            @PathVariable Long id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        householdService.validateMembership(id, principal.getId());
        return ResponseEntity.ok(activityLogService.getHouseholdActivities(id, pageable));
    }

    @GetMapping("/{id}/activities/recent")
    public ResponseEntity<List<ActivityLogResponse>> getRecentActivities(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        householdService.validateMembership(id, principal.getId());
        return ResponseEntity.ok(activityLogService.getRecentHouseholdActivities(id));
    }
}
