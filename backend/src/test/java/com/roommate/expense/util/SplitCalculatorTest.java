package com.roommate.expense.util;

import com.roommate.expense.dto.ParticipantShareDTO;
import com.roommate.expense.enums.SplitType;
import com.roommate.expense.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SplitCalculatorTest {

    private SplitCalculator splitCalculator;

    @BeforeEach
    void setUp() {
        splitCalculator = new SplitCalculator();
    }

    @Test
    void testEqualSplitEven() {
        BigDecimal total = new BigDecimal("4000.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, null),
                new ParticipantShareDTO(2L, null),
                new ParticipantShareDTO(3L, null),
                new ParticipantShareDTO(4L, null)
        );

        Map<Long, BigDecimal> shares = splitCalculator.calculateShares(total, SplitType.EQUAL, participants);

        assertEquals(4, shares.size());
        assertEquals(new BigDecimal("1000.00"), shares.get(1L));
        assertEquals(new BigDecimal("1000.00"), shares.get(2L));
        assertEquals(new BigDecimal("1000.00"), shares.get(3L));
        assertEquals(new BigDecimal("1000.00"), shares.get(4L));

        BigDecimal sum = shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    void testEqualSplitUnevenCents() {
        BigDecimal total = new BigDecimal("100.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, null),
                new ParticipantShareDTO(2L, null),
                new ParticipantShareDTO(3L, null)
        );

        Map<Long, BigDecimal> shares = splitCalculator.calculateShares(total, SplitType.EQUAL, participants);

        assertEquals(3, shares.size());
        assertEquals(new BigDecimal("33.34"), shares.get(1L));
        assertEquals(new BigDecimal("33.33"), shares.get(2L));
        assertEquals(new BigDecimal("33.33"), shares.get(3L));

        BigDecimal sum = shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }

    @Test
    void testExactSplitSuccess() {
        BigDecimal total = new BigDecimal("4000.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, new BigDecimal("1500.00")),
                new ParticipantShareDTO(2L, new BigDecimal("1000.00")),
                new ParticipantShareDTO(3L, new BigDecimal("800.00")),
                new ParticipantShareDTO(4L, new BigDecimal("700.00"))
        );

        Map<Long, BigDecimal> shares = splitCalculator.calculateShares(total, SplitType.EXACT, participants);

        assertEquals(new BigDecimal("1500.00"), shares.get(1L));
        assertEquals(new BigDecimal("1000.00"), shares.get(2L));
        assertEquals(new BigDecimal("800.00"), shares.get(3L));
        assertEquals(new BigDecimal("700.00"), shares.get(4L));
    }

    @Test
    void testExactSplitInvalidSum() {
        BigDecimal total = new BigDecimal("4000.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, new BigDecimal("1500.00")),
                new ParticipantShareDTO(2L, new BigDecimal("1000.00"))
        );

        assertThrows(BadRequestException.class, () ->
                splitCalculator.calculateShares(total, SplitType.EXACT, participants));
    }

    @Test
    void testPercentageSplitSuccess() {
        BigDecimal total = new BigDecimal("4000.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, new BigDecimal("25.00")),
                new ParticipantShareDTO(2L, new BigDecimal("25.00")),
                new ParticipantShareDTO(3L, new BigDecimal("25.00")),
                new ParticipantShareDTO(4L, new BigDecimal("25.00"))
        );

        Map<Long, BigDecimal> shares = splitCalculator.calculateShares(total, SplitType.PERCENTAGE, participants);

        assertEquals(new BigDecimal("1000.00"), shares.get(1L));
        assertEquals(new BigDecimal("1000.00"), shares.get(2L));
        assertEquals(new BigDecimal("1000.00"), shares.get(3L));
        assertEquals(new BigDecimal("1000.00"), shares.get(4L));
    }

    @Test
    void testSharesSplitSuccess() {
        BigDecimal total = new BigDecimal("5000.00");
        List<ParticipantShareDTO> participants = Arrays.asList(
                new ParticipantShareDTO(1L, new BigDecimal("2")),
                new ParticipantShareDTO(2L, new BigDecimal("1")),
                new ParticipantShareDTO(3L, new BigDecimal("1")),
                new ParticipantShareDTO(4L, new BigDecimal("1"))
        );

        Map<Long, BigDecimal> shares = splitCalculator.calculateShares(total, SplitType.SHARES, participants);

        assertEquals(new BigDecimal("2000.00"), shares.get(1L));
        assertEquals(new BigDecimal("1000.00"), shares.get(2L));
        assertEquals(new BigDecimal("1000.00"), shares.get(3L));
        assertEquals(new BigDecimal("1000.00"), shares.get(4L));

        BigDecimal sum = shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(total, sum);
    }
}
