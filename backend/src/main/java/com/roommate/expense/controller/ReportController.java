package com.roommate.expense.controller;

import com.roommate.expense.dto.ReportDTOs.CategoryExpenseDTO;
import com.roommate.expense.dto.ReportDTOs.MemberContributionDTO;
import com.roommate.expense.dto.ReportDTOs.MonthlyReportResponse;
import com.roommate.expense.security.UserPrincipal;
import com.roommate.expense.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthlyReport(
            @RequestParam Long householdId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(reportService.getReport(householdId, startDate, endDate, principal.getId()));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryExpenseDTO>> getCategoryReport(
            @RequestParam Long householdId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        MonthlyReportResponse report = reportService.getReport(householdId, startDate, endDate, principal.getId());
        return ResponseEntity.ok(report.getCategoryBreakdown());
    }

    @GetMapping("/members")
    public ResponseEntity<List<MemberContributionDTO>> getMemberReport(
            @RequestParam Long householdId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal) {
        MonthlyReportResponse report = reportService.getReport(householdId, startDate, endDate, principal.getId());
        return ResponseEntity.ok(report.getMemberContributions());
    }
}
