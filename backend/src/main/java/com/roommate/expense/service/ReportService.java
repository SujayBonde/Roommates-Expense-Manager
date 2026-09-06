package com.roommate.expense.service;

import com.roommate.expense.dto.ReportDTOs.*;
import com.roommate.expense.entity.Expense;
import com.roommate.expense.entity.ExpenseParticipant;
import com.roommate.expense.entity.HouseholdMember;
import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.repository.ExpenseRepository;
import com.roommate.expense.repository.HouseholdMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ExpenseRepository expenseRepository;
    private final HouseholdMemberRepository memberRepository;

    @Transactional(readOnly = true)
    public MonthlyReportResponse getReport(
            Long householdId,
            LocalDate startDate,
            LocalDate endDate,
            Long currentUserId) {

        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, currentUserId)) {
            throw new ForbiddenException("Access denied to household reports");
        }

        LocalDate now = LocalDate.now();
        LocalDate start = (startDate != null) ? startDate : now.withDayOfMonth(1);
        LocalDate end = (endDate != null) ? endDate : now;

        List<Expense> expenses = expenseRepository
                .findByHouseholdIdAndExpenseDateBetweenOrderByExpenseDateDesc(householdId, start, end);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long days = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        BigDecimal dailyAverage = totalExpenses.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);

        // Highest Expense
        Expense highest = expenses.stream()
                .max(Comparator.comparing(Expense::getTotalAmount))
                .orElse(null);

        // Category breakdown
        Map<CategoryType, BigDecimal> categoryMap = new EnumMap<>(CategoryType.class);
        for (Expense e : expenses) {
            categoryMap.merge(e.getCategory(), e.getTotalAmount(), BigDecimal::add);
        }

        List<CategoryExpenseDTO> categoryBreakdown = new ArrayList<>();
        CategoryType mostExpensiveCategory = null;
        BigDecimal maxCategoryAmount = BigDecimal.ZERO;

        for (Map.Entry<CategoryType, BigDecimal> entry : categoryMap.entrySet()) {
            BigDecimal amt = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            BigDecimal pct = (totalExpenses.compareTo(BigDecimal.ZERO) > 0)
                    ? amt.multiply(new BigDecimal("100")).divide(totalExpenses, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            categoryBreakdown.add(CategoryExpenseDTO.builder()
                    .category(entry.getKey())
                    .amount(amt)
                    .percentage(pct)
                    .build());

            if (amt.compareTo(maxCategoryAmount) > 0) {
                maxCategoryAmount = amt;
                mostExpensiveCategory = entry.getKey();
            }
        }
        categoryBreakdown.sort((a, b) -> b.getAmount().compareTo(a.getAmount()));

        // Member contributions
        List<HouseholdMember> members = memberRepository.findByHouseholdId(householdId);
        Map<Long, BigDecimal> memberPaidMap = new HashMap<>();
        Map<Long, BigDecimal> memberShareMap = new HashMap<>();

        for (HouseholdMember m : members) {
            memberPaidMap.put(m.getUser().getId(), BigDecimal.ZERO);
            memberShareMap.put(m.getUser().getId(), BigDecimal.ZERO);
        }

        for (Expense e : expenses) {
            memberPaidMap.merge(e.getPaidBy().getId(), e.getTotalAmount(), BigDecimal::add);
            for (ExpenseParticipant p : e.getParticipants()) {
                memberShareMap.merge(p.getUser().getId(), p.getShareAmount(), BigDecimal::add);
            }
        }

        List<MemberContributionDTO> memberContributions = new ArrayList<>();
        String topSpenderName = "N/A";
        BigDecimal topSpenderAmount = BigDecimal.ZERO;

        for (HouseholdMember m : members) {
            Long uid = m.getUser().getId();
            BigDecimal paid = memberPaidMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal share = memberShareMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            BigDecimal pct = (totalExpenses.compareTo(BigDecimal.ZERO) > 0)
                    ? paid.multiply(new BigDecimal("100")).divide(totalExpenses, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            memberContributions.add(MemberContributionDTO.builder()
                    .userId(uid)
                    .name(m.getUser().getName())
                    .totalPaid(paid)
                    .totalShare(share)
                    .percentage(pct)
                    .build());

            if (paid.compareTo(topSpenderAmount) > 0) {
                topSpenderAmount = paid;
                topSpenderName = m.getUser().getName();
            }
        }
        memberContributions.sort((a, b) -> b.getTotalPaid().compareTo(a.getTotalPaid()));

        // Monthly trend (last 6 months or period)
        List<Expense> allRecentExpenses = expenseRepository
                .findByHouseholdIdAndExpenseDateBetweenOrderByExpenseDateDesc(
                        householdId, start.minusMonths(5).withDayOfMonth(1), end);

        DateTimeFormatter monthYearFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, BigDecimal> trendMap = new LinkedHashMap<>();

        // Pre-fill months in order
        LocalDate temp = start.minusMonths(5).withDayOfMonth(1);
        while (!temp.isAfter(end)) {
            trendMap.put(temp.format(monthYearFormatter), BigDecimal.ZERO);
            temp = temp.plusMonths(1);
        }

        for (Expense e : allRecentExpenses) {
            String monthLabel = e.getExpenseDate().format(monthYearFormatter);
            trendMap.merge(monthLabel, e.getTotalAmount(), BigDecimal::add);
        }

        List<MonthlyTrendDTO> monthlyTrend = trendMap.entrySet().stream()
                .map(e -> MonthlyTrendDTO.builder()
                        .month(e.getKey())
                        .amount(e.getValue().setScale(2, RoundingMode.HALF_UP))
                        .build())
                .collect(Collectors.toList());

        String periodLabel = start.format(DateTimeFormatter.ofPattern("dd MMM yyyy")) + " - " +
                end.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        return MonthlyReportResponse.builder()
                .period(periodLabel)
                .totalExpenses(totalExpenses)
                .dailyAverage(dailyAverage)
                .highestExpenseAmount(highest != null ? highest.getTotalAmount() : BigDecimal.ZERO)
                .highestExpenseTitle(highest != null ? highest.getTitle() : "None")
                .mostExpensiveCategory(mostExpensiveCategory != null ? mostExpensiveCategory : CategoryType.OTHER)
                .topSpenderName(topSpenderName)
                .topSpenderAmount(topSpenderAmount)
                .categoryBreakdown(categoryBreakdown)
                .memberContributions(memberContributions)
                .monthlyTrend(monthlyTrend)
                .build();
    }
}
