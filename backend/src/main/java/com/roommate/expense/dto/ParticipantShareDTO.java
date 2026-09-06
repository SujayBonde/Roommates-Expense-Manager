package com.roommate.expense.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantShareDTO {

    @NotNull(message = "Participant user ID is required")
    private Long userId;

    /**
     * Exact amount for EXACT split, percentage for PERCENTAGE split,
     * number of shares for SHARES split, or null for EQUAL split.
     */
    private BigDecimal shareValue;
}
