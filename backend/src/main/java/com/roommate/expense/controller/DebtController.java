package com.roommate.expense.controller;

import com.roommate.expense.dto.DebtResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.DebtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping("/{id}/debts")
    public ResponseEntity<DebtResponse> getDebts(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(debtService.calculateDebts(id, principal.getId()));
    }
}
