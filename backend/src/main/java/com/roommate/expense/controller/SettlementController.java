package com.roommate.expense.controller;

import com.roommate.expense.dto.SettlementRequest;
import com.roommate.expense.dto.SettlementResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<SettlementResponse> recordSettlement(
            @Valid @RequestBody SettlementRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(settlementService.recordSettlement(request, principal.getId()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SettlementResponse>> getSettlements(
            @RequestParam Long householdId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(settlementService.getSettlements(householdId, principal.getId()));
    }
}
