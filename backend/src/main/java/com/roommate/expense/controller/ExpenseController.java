package com.roommate.expense.controller;

import com.roommate.expense.dto.CreateExpenseRequest;
import com.roommate.expense.dto.ExpenseResponse;
import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return new ResponseEntity<>(expenseService.createExpense(request, principal.getId()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<ExpenseResponse>> getExpenses(
            @RequestParam Long householdId,
            @RequestParam(required = false) CategoryType category,
            @RequestParam(required = false) Long paidById,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "expenseDate", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(expenseService.getExpenses(
                householdId, category, paidById, startDate, endDate, search, pageable, principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpenseById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(expenseService.getExpenseById(id, principal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(expenseService.updateExpense(id, request, principal.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        expenseService.deleteExpense(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
