package com.roommate.expense.service;

import com.roommate.expense.dto.BalanceResponse;
import com.roommate.expense.dto.MemberBalanceDTO;
import com.roommate.expense.entity.*;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.exception.ResourceNotFoundException;
import com.roommate.expense.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseParticipantRepository participantRepository;
    private final SettlementRepository settlementRepository;

    @Transactional(readOnly = true)
    public BalanceResponse calculateBalances(Long householdId, Long currentUserId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, currentUserId)) {
            throw new ForbiddenException("Access denied to household balances");
        }

        List<HouseholdMember> members = memberRepository.findByHouseholdId(householdId);
        List<Expense> expenses = expenseRepository.findByHouseholdIdOrderByExpenseDateDescCreatedAtDesc(householdId);
        List<Settlement> settlements = settlementRepository.findByHouseholdIdOrderByPaymentDateDescCreatedAtDesc(householdId);

        // 1. Total expenses in household
        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // Map userId -> totals
        Map<Long, BigDecimal> expensePaidMap = new HashMap<>();
        Map<Long, BigDecimal> expenseShareMap = new HashMap<>();
        Map<Long, BigDecimal> settlementPaidMap = new HashMap<>();
        Map<Long, BigDecimal> settlementReceivedMap = new HashMap<>();

        for (HouseholdMember member : members) {
            Long uid = member.getUser().getId();
            expensePaidMap.put(uid, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            expenseShareMap.put(uid, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            settlementPaidMap.put(uid, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            settlementReceivedMap.put(uid, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        // Aggregate expenses paid
        for (Expense e : expenses) {
            Long payerId = e.getPaidBy().getId();
            expensePaidMap.merge(payerId, e.getTotalAmount(), BigDecimal::add);

            for (ExpenseParticipant p : e.getParticipants()) {
                Long uid = p.getUser().getId();
                expenseShareMap.merge(uid, p.getShareAmount(), BigDecimal::add);
            }
        }

        // Aggregate settlements
        for (Settlement s : settlements) {
            settlementPaidMap.merge(s.getPayer().getId(), s.getAmount(), BigDecimal::add);
            settlementReceivedMap.merge(s.getReceiver().getId(), s.getAmount(), BigDecimal::add);
        }

        List<MemberBalanceDTO> memberBalances = new ArrayList<>();
        BigDecimal myPaid = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal myShare = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal myNetBalance = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal myNeedToPay = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal myWillReceive = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (HouseholdMember m : members) {
            User u = m.getUser();
            Long uid = u.getId();

            BigDecimal paid = expensePaidMap.getOrDefault(uid, BigDecimal.ZERO)
                    .add(settlementPaidMap.getOrDefault(uid, BigDecimal.ZERO))
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal share = expenseShareMap.getOrDefault(uid, BigDecimal.ZERO)
                    .add(settlementReceivedMap.getOrDefault(uid, BigDecimal.ZERO))
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal net = paid.subtract(share).setScale(2, RoundingMode.HALF_UP);

            BigDecimal receive = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            BigDecimal pay = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            if (net.compareTo(BigDecimal.ZERO) > 0) {
                receive = net;
            } else if (net.compareTo(BigDecimal.ZERO) < 0) {
                pay = net.abs();
            }

            MemberBalanceDTO dto = MemberBalanceDTO.builder()
                    .userId(uid)
                    .name(u.getName())
                    .email(u.getEmail())
                    .profileImage(u.getProfileImage())
                    .totalPaid(paid)
                    .totalShare(share)
                    .netBalance(net)
                    .shouldReceive(receive)
                    .shouldPay(pay)
                    .build();

            memberBalances.add(dto);

            if (uid.equals(currentUserId)) {
                // For the user summary cards, we show their expense-level paid and share
                myPaid = expensePaidMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
                myShare = expenseShareMap.getOrDefault(uid, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
                myNetBalance = net;
                myNeedToPay = pay;
                myWillReceive = receive;
            }
        }

        return BalanceResponse.builder()
                .householdId(household.getId())
                .householdName(household.getName())
                .totalExpenses(totalExpenses)
                .myPaid(myPaid)
                .myShare(myShare)
                .myNetBalance(myNetBalance)
                .myNeedToPay(myNeedToPay)
                .myWillReceive(myWillReceive)
                .memberBalances(memberBalances)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> getNetBalancesMap(Long householdId) {
        BalanceResponse response = calculateBalances(householdId,
                memberRepository.findByHouseholdId(householdId).get(0).getUser().getId());

        Map<Long, BigDecimal> map = new HashMap<>();
        for (MemberBalanceDTO b : response.getMemberBalances()) {
            map.put(b.getUserId(), b.getNetBalance());
        }
        return map;
    }
}
