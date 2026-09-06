package com.roommate.expense.dto;

import com.roommate.expense.enums.CategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public final class ReportDTOs {

    private ReportDTOs() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryExpenseDTO {
        private CategoryType category;
        private BigDecimal amount;
        private BigDecimal percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberContributionDTO {
        private Long userId;
        private String name;
        private BigDecimal totalPaid;
        private BigDecimal totalShare;
        private BigDecimal percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendDTO {
        private String month;
        private BigDecimal amount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyReportResponse {
        private String period;
        private BigDecimal totalExpenses;
        private BigDecimal dailyAverage;
        private BigDecimal highestExpenseAmount;
        private String highestExpenseTitle;
        private CategoryType mostExpensiveCategory;
        private String topSpenderName;
        private BigDecimal topSpenderAmount;
        private List<CategoryExpenseDTO> categoryBreakdown;
        private List<MemberContributionDTO> memberContributions;
        private List<MonthlyTrendDTO> monthlyTrend;
    }
}
