package com.roommate.expense.controller;

import com.roommate.expense.dto.CreateHouseholdRequest;
import com.roommate.expense.dto.HouseholdResponse;
import com.roommate.expense.dto.JoinHouseholdRequest;
import com.roommate.expense.dto.MemberResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.HouseholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
public class HouseholdController {

    private final HouseholdService householdService;

    @PostMapping
    public ResponseEntity<HouseholdResponse> createHousehold(
            @Valid @RequestBody CreateHouseholdRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(householdService.createHousehold(request, principal.getId()), HttpStatus.CREATED);
    }

    @PostMapping("/join")
    public ResponseEntity<HouseholdResponse> joinHousehold(
            @Valid @RequestBody JoinHouseholdRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(householdService.joinHousehold(request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<HouseholdResponse>> getUserHouseholds(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(householdService.getUserHouseholds(principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HouseholdResponse> getHouseholdById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(householdService.getHouseholdById(id, principal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HouseholdResponse> updateHousehold(
            @PathVariable Long id,
            @Valid @RequestBody CreateHouseholdRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(householdService.updateHousehold(id, request, principal.getId()));
    }

    @PostMapping("/{id}/regenerate-code")
    public ResponseEntity<Map<String, String>> regenerateInviteCode(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        String newCode = householdService.regenerateInviteCode(id, principal.getId());
        return ResponseEntity.ok(Map.of("inviteCode", newCode));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> getHouseholdMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(householdService.getHouseholdMembers(id, principal.getId()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        householdService.removeMember(id, userId, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveHousehold(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        householdService.leaveHousehold(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
