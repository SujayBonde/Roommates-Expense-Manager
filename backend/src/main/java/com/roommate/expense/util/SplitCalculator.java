package com.roommate.expense.util;

import com.roommate.expense.dto.ParticipantShareDTO;
import com.roommate.expense.enums.SplitType;
import com.roommate.expense.exception.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class SplitCalculator {

    private static final BigDecimal HUNDRED = new BigDecimal("100.00");
    private static final BigDecimal ZERO = new BigDecimal("0.00");

    /**
     * Calculates the exact share amount for each participant based on the split type.
     * Ensures the sum of all participant shares equals the totalAmount down to the last cent/paise.
     */
    public Map<Long, BigDecimal> calculateShares(
            BigDecimal totalAmount,
            SplitType splitType,
            List<ParticipantShareDTO> participants) {

        if (participants == null || participants.isEmpty()) {
            throw new BadRequestException("At least one participant is required for an expense");
        }

        BigDecimal scaledTotal = totalAmount.setScale(2, RoundingMode.HALF_UP);
        Map<Long, BigDecimal> result = new HashMap<>();

        switch (splitType) {
            case EQUAL -> calculateEqualSplit(scaledTotal, participants, result);
            case EXACT -> calculateExactSplit(scaledTotal, participants, result);
            case PERCENTAGE -> calculatePercentageSplit(scaledTotal, participants, result);
            case SHARES -> calculateSharesSplit(scaledTotal, participants, result);
            default -> throw new BadRequestException("Unsupported split type: " + splitType);
        }

        // Final verification that sum of shares matches total amount
        BigDecimal sum = result.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        if (sum.compareTo(scaledTotal) != 0) {
            throw new BadRequestException(
                    String.format("Calculated shares sum (%s) does not match total amount (%s)", sum, scaledTotal));
        }

        return result;
    }

    private void calculateEqualSplit(
            BigDecimal totalAmount,
            List<ParticipantShareDTO> participants,
            Map<Long, BigDecimal> result) {

        int count = participants.size();
        BigDecimal countBD = BigDecimal.valueOf(count);

        // Base share rounded down to 2 decimals
        BigDecimal baseShare = totalAmount.divide(countBD, 2, RoundingMode.FLOOR);
        BigDecimal remainder = totalAmount.subtract(baseShare.multiply(countBD)).setScale(2, RoundingMode.HALF_UP);

        // Remainder is distributed cent by cent to the first N participants
        int centsRemainder = remainder.multiply(new BigDecimal("100")).intValue();

        for (int i = 0; i < count; i++) {
            Long userId = participants.get(i).getUserId();
            BigDecimal share = baseShare;
            if (i < centsRemainder) {
                share = share.add(new BigDecimal("0.01"));
            }
            result.put(userId, share.setScale(2, RoundingMode.HALF_UP));
        }
    }

    private void calculateExactSplit(
            BigDecimal totalAmount,
            List<ParticipantShareDTO> participants,
            Map<Long, BigDecimal> result) {

        BigDecimal totalShares = BigDecimal.ZERO;

        for (ParticipantShareDTO p : participants) {
            if (p.getShareValue() == null || p.getShareValue().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Exact share value must be non-negative for participant " + p.getUserId());
            }
            BigDecimal share = p.getShareValue().setScale(2, RoundingMode.HALF_UP);
            result.put(p.getUserId(), share);
            totalShares = totalShares.add(share);
        }

        if (totalShares.compareTo(totalAmount) != 0) {
            throw new BadRequestException(
                    String.format("Sum of exact shares (%s) does not match total expense amount (%s)",
                            totalShares, totalAmount));
        }
    }

    private void calculatePercentageSplit(
            BigDecimal totalAmount,
            List<ParticipantShareDTO> participants,
            Map<Long, BigDecimal> result) {

        BigDecimal totalPercentage = BigDecimal.ZERO;
        for (ParticipantShareDTO p : participants) {
            if (p.getShareValue() == null || p.getShareValue().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Percentage value must be non-negative for participant " + p.getUserId());
            }
            totalPercentage = totalPercentage.add(p.getShareValue());
        }

        if (totalPercentage.setScale(2, RoundingMode.HALF_UP).compareTo(HUNDRED) != 0) {
            throw new BadRequestException(
                    String.format("Sum of percentages must equal 100.00%%, got: %s%%", totalPercentage));
        }

        BigDecimal distributed = BigDecimal.ZERO;
        for (int i = 0; i < participants.size(); i++) {
            ParticipantShareDTO p = participants.get(i);
            BigDecimal share = totalAmount.multiply(p.getShareValue())
                    .divide(HUNDRED, 2, RoundingMode.HALF_UP);

            result.put(p.getUserId(), share);
            distributed = distributed.add(share);
        }

        // Adjust any rounding cent difference on the first participant
        BigDecimal diff = totalAmount.subtract(distributed).setScale(2, RoundingMode.HALF_UP);
        if (diff.compareTo(BigDecimal.ZERO) != 0 && !participants.isEmpty()) {
            Long firstUserId = participants.get(0).getUserId();
            result.put(firstUserId, result.get(firstUserId).add(diff).setScale(2, RoundingMode.HALF_UP));
        }
    }

    private void calculateSharesSplit(
            BigDecimal totalAmount,
            List<ParticipantShareDTO> participants,
            Map<Long, BigDecimal> result) {

        BigDecimal totalShares = BigDecimal.ZERO;
        for (ParticipantShareDTO p : participants) {
            if (p.getShareValue() == null || p.getShareValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Share multiplier must be greater than 0 for participant " + p.getUserId());
            }
            totalShares = totalShares.add(p.getShareValue());
        }

        BigDecimal distributed = BigDecimal.ZERO;
        for (int i = 0; i < participants.size(); i++) {
            ParticipantShareDTO p = participants.get(i);
            BigDecimal share = totalAmount.multiply(p.getShareValue())
                    .divide(totalShares, 2, RoundingMode.HALF_UP);

            result.put(p.getUserId(), share);
            distributed = distributed.add(share);
        }

        // Adjust rounding discrepancy on the first participant
        BigDecimal diff = totalAmount.subtract(distributed).setScale(2, RoundingMode.HALF_UP);
        if (diff.compareTo(BigDecimal.ZERO) != 0 && !participants.isEmpty()) {
            Long firstUserId = participants.get(0).getUserId();
            result.put(firstUserId, result.get(firstUserId).add(diff).setScale(2, RoundingMode.HALF_UP));
        }
    }
}
