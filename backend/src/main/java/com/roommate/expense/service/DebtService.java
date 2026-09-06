package com.roommate.expense.service;

import com.roommate.expense.dto.DebtResponse;
import com.roommate.expense.dto.PairwiseDebtDTO;
import com.roommate.expense.entity.Expense;
import com.roommate.expense.entity.ExpenseParticipant;
import com.roommate.expense.entity.HouseholdMember;
import com.roommate.expense.entity.Settlement;
import com.roommate.expense.entity.User;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.repository.ExpenseRepository;
import com.roommate.expense.repository.HouseholdMemberRepository;
import com.roommate.expense.repository.SettlementRepository;
import com.roommate.expense.util.MinimumSettlementCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DebtService {

    private final BalanceService balanceService;
    private final HouseholdMemberRepository memberRepository;
    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final MinimumSettlementCalculator settlementCalculator;

    @Transactional(readOnly = true)
    public DebtResponse calculateDebts(Long householdId, Long currentUserId) {
        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, currentUserId)) {
            throw new ForbiddenException("Access denied to household debt data");
        }

        List<HouseholdMember> members = memberRepository.findByHouseholdId(householdId);
        Map<Long, User> userMap = new HashMap<>();
        for (HouseholdMember m : members) {
            userMap.put(m.getUser().getId(), m.getUser());
        }

        // 1. Direct pairwise debts: debts[payerId][receiverId] = amount that payerId owes receiverId
        Map<Long, Map<Long, BigDecimal>> pairwiseMatrix = new HashMap<>();
        for (HouseholdMember m1 : members) {
            pairwiseMatrix.put(m1.getUser().getId(), new HashMap<>());
            for (HouseholdMember m2 : members) {
                pairwiseMatrix.get(m1.getUser().getId()).put(m2.getUser().getId(), BigDecimal.ZERO);
            }
        }

        List<Expense> expenses = expenseRepository.findByHouseholdIdOrderByExpenseDateDescCreatedAtDesc(householdId);
        for (Expense e : expenses) {
            Long paidById = e.getPaidBy().getId();
            for (ExpenseParticipant p : e.getParticipants()) {
                Long participantId = p.getUser().getId();
                if (!participantId.equals(paidById)) {
                    // Participant owes paidBy
                    Map<Long, BigDecimal> map = pairwiseMatrix.get(participantId);
                    if (map != null) {
                        map.put(paidById, map.getOrDefault(paidById, BigDecimal.ZERO).add(p.getShareAmount()));
                    }
                }
            }
        }

        // Deduct settlements from pairwise debts
        List<Settlement> settlements = settlementRepository.findByHouseholdIdOrderByPaymentDateDescCreatedAtDesc(householdId);
        for (Settlement s : settlements) {
            Long payerId = s.getPayer().getId();
            Long receiverId = s.getReceiver().getId();

            Map<Long, BigDecimal> map = pairwiseMatrix.get(payerId);
            if (map != null) {
                BigDecimal currentDebt = map.getOrDefault(receiverId, BigDecimal.ZERO);
                map.put(receiverId, currentDebt.subtract(s.getAmount()));
            }
        }

        // Simplify direct debts: if A owes B $X and B owes A $Y, net is A owes B $(X-Y)
        List<PairwiseDebtDTO> directDebts = new ArrayList<>();
        List<Long> userIds = new ArrayList<>(userMap.keySet());

        for (int i = 0; i < userIds.size(); i++) {
            for (int j = i + 1; j < userIds.size(); j++) {
                Long u1 = userIds.get(i);
                Long u2 = userIds.get(j);

                BigDecimal debt1to2 = pairwiseMatrix.getOrDefault(u1, Collections.emptyMap()).getOrDefault(u2, BigDecimal.ZERO);
                BigDecimal debt2to1 = pairwiseMatrix.getOrDefault(u2, Collections.emptyMap()).getOrDefault(u1, BigDecimal.ZERO);

                BigDecimal net = debt1to2.subtract(debt2to1).setScale(2, RoundingMode.HALF_UP);

                if (net.compareTo(BigDecimal.ZERO) > 0) {
                    // u1 owes u2 net amount
                    User from = userMap.get(u1);
                    User to = userMap.get(u2);
                    directDebts.add(PairwiseDebtDTO.builder()
                            .fromUserId(u1)
                            .fromUserName(from != null ? from.getName() : "User " + u1)
                            .fromUserEmail(from != null ? from.getEmail() : "")
                            .toUserId(u2)
                            .toUserName(to != null ? to.getName() : "User " + u2)
                            .toUserEmail(to != null ? to.getEmail() : "")
                            .amount(net)
                            .build());
                } else if (net.compareTo(BigDecimal.ZERO) < 0) {
                    // u2 owes u1 net.abs()
                    User from = userMap.get(u2);
                    User to = userMap.get(u1);
                    directDebts.add(PairwiseDebtDTO.builder()
                            .fromUserId(u2)
                            .fromUserName(from != null ? from.getName() : "User " + u2)
                            .fromUserEmail(from != null ? from.getEmail() : "")
                            .toUserId(u1)
                            .toUserName(to != null ? to.getName() : "User " + u1)
                            .toUserEmail(to != null ? to.getEmail() : "")
                            .amount(net.abs())
                            .build());
                }
            }
        }

        // 2. Minimum Settlement Algorithm
        Map<Long, BigDecimal> netBalances = balanceService.getNetBalancesMap(householdId);
        List<PairwiseDebtDTO> minimumSettlements = settlementCalculator.calculateMinimumSettlements(netBalances, userMap);

        return DebtResponse.builder()
                .directDebts(directDebts)
                .minimumSettlements(minimumSettlements)
                .build();
    }
}
