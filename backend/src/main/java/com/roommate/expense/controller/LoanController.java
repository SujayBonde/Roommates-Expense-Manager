package com.roommate.expense.controller;

import com.roommate.expense.dto.CreateLoanRequest;
import com.roommate.expense.dto.LoanPaymentRequest;
import com.roommate.expense.dto.LoanResponse;
import com.roommate.expense.enums.LoanStatus;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    public ResponseEntity<LoanResponse> createLoan(
            @Valid @RequestBody CreateLoanRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(loanService.createLoan(request, principal.getId()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<LoanResponse>> getLoans(
            @RequestParam Long householdId,
            @RequestParam(required = false) LoanStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(loanService.getLoans(householdId, status, principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoanById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(loanService.getLoanById(id, principal.getId()));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<LoanResponse> addPayment(
            @PathVariable Long id,
            @Valid @RequestBody LoanPaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(loanService.addLoanPayment(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        loanService.deleteLoan(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
