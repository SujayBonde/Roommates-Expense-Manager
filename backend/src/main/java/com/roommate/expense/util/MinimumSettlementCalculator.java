package com.roommate.expense.util;

import com.roommate.expense.dto.PairwiseDebtDTO;
import com.roommate.expense.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Component
public class MinimumSettlementCalculator {

    private static class PersonBalance {
        Long userId;
        BigDecimal amount; // positive value representing either what they owe or what they receive

        PersonBalance(Long userId, BigDecimal amount) {
            this.userId = userId;
            this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        }
    }

    /**
     * Calculates the minimum number of transactions required to settle all net balances.
     *
     * @param netBalances Map of userId to their net balance (positive = receives, negative = owes)
     * @param userMap Map of userId to User entity for resolving names/emails
     * @return List of optimal settlement transactions
     */
    public List<PairwiseDebtDTO> calculateMinimumSettlements(
            Map<Long, BigDecimal> netBalances,
            Map<Long, User> userMap) {

        List<PairwiseDebtDTO> settlements = new ArrayList<>();
        if (netBalances == null || netBalances.isEmpty()) {
            return settlements;
        }

        List<PersonBalance> debtors = new ArrayList<>();   // owes money
        List<PersonBalance> creditors = new ArrayList<>(); // receives money

        for (Map.Entry<Long, BigDecimal> entry : netBalances.entrySet()) {
            BigDecimal balance = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            int cmp = balance.compareTo(BigDecimal.ZERO);
            if (cmp < 0) {
                // Owes money (store as positive amount)
                debtors.add(new PersonBalance(entry.getKey(), balance.abs()));
            } else if (cmp > 0) {
                // Receives money
                creditors.add(new PersonBalance(entry.getKey(), balance));
            }
        }

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            // Sort to match largest debtor with largest creditor
            debtors.sort((a, b) -> b.amount.compareTo(a.amount));
            creditors.sort((a, b) -> b.amount.compareTo(a.amount));

            PersonBalance debtor = debtors.get(0);
            PersonBalance creditor = creditors.get(0);

            BigDecimal settleAmount = debtor.amount.min(creditor.amount);

            if (settleAmount.compareTo(BigDecimal.ZERO) > 0) {
                User debtorUser = userMap.get(debtor.userId);
                User creditorUser = userMap.get(creditor.userId);

                settlements.add(PairwiseDebtDTO.builder()
                        .fromUserId(debtor.userId)
                        .fromUserName(debtorUser != null ? debtorUser.getName() : "User " + debtor.userId)
                        .fromUserEmail(debtorUser != null ? debtorUser.getEmail() : "")
                        .toUserId(creditor.userId)
                        .toUserName(creditorUser != null ? creditorUser.getName() : "User " + creditor.userId)
                        .toUserEmail(creditorUser != null ? creditorUser.getEmail() : "")
                        .amount(settleAmount.setScale(2, RoundingMode.HALF_UP))
                        .build());
            }

            debtor.amount = debtor.amount.subtract(settleAmount).setScale(2, RoundingMode.HALF_UP);
            creditor.amount = creditor.amount.subtract(settleAmount).setScale(2, RoundingMode.HALF_UP);

            if (debtor.amount.compareTo(BigDecimal.ZERO) == 0) {
                debtors.remove(0);
            }
            if (creditor.amount.compareTo(BigDecimal.ZERO) == 0) {
                creditors.remove(0);
            }
        }

        return settlements;
    }
}
