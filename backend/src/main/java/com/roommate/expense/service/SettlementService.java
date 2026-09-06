package com.roommate.expense.service;

import com.roommate.expense.dto.SettlementRequest;
import com.roommate.expense.dto.SettlementResponse;
import com.roommate.expense.entity.Household;
import com.roommate.expense.entity.Settlement;
import com.roommate.expense.entity.User;
import com.roommate.expense.enums.ActivityType;
import com.roommate.expense.enums.NotificationType;
import com.roommate.expense.exception.BadRequestException;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.exception.ResourceNotFoundException;
import com.roommate.expense.repository.HouseholdMemberRepository;
import com.roommate.expense.repository.HouseholdRepository;
import com.roommate.expense.repository.SettlementRepository;
import com.roommate.expense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional
    public SettlementResponse recordSettlement(SettlementRequest request, Long payerUserId) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        validateMembership(household.getId(), payerUserId);
        validateMembership(household.getId(), request.getReceiverId());

        if (payerUserId.equals(request.getReceiverId())) {
            throw new BadRequestException("Payer and receiver cannot be the same user");
        }

        User payer = userRepository.findById(payerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Payer not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        BigDecimal amount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        Settlement settlement = Settlement.builder()
                .payer(payer)
                .receiver(receiver)
                .household(household)
                .amount(amount)
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .note(request.getNote())
                .build();

        Settlement savedSettlement = settlementRepository.save(settlement);

        activityLogService.logActivity(
                household,
                payer,
                ActivityType.SETTLEMENT_CREATED,
                payer.getName() + " paid " + receiver.getName() + " ₹" + amount
        );

        notificationService.createNotification(
                receiver,
                payer.getName() + " recorded a settlement payment of ₹" + amount + " to you",
                NotificationType.SETTLEMENT_RECORDED,
                savedSettlement.getId()
        );

        return mapToResponse(savedSettlement);
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> getSettlements(Long householdId, Long currentUserId) {
        validateMembership(householdId, currentUserId);
        return settlementRepository.findByHouseholdIdOrderByPaymentDateDescCreatedAtDesc(householdId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void validateMembership(Long householdId, Long userId) {
        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, userId)) {
            throw new ForbiddenException("You do not belong to this household");
        }
    }

    public SettlementResponse mapToResponse(Settlement s) {
        return SettlementResponse.builder()
                .id(s.getId())
                .payerId(s.getPayer().getId())
                .payerName(s.getPayer().getName())
                .payerEmail(s.getPayer().getEmail())
                .receiverId(s.getReceiver().getId())
                .receiverName(s.getReceiver().getName())
                .receiverEmail(s.getReceiver().getEmail())
                .householdId(s.getHousehold().getId())
                .amount(s.getAmount())
                .paymentDate(s.getPaymentDate())
                .note(s.getNote())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
