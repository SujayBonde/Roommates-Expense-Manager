package com.roommate.expense.controller;

import com.roommate.expense.dto.BalanceResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping("/{id}/balances")
    public ResponseEntity<BalanceResponse> getBalances(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(balanceService.calculateBalances(id, principal.getId()));
    }
}
