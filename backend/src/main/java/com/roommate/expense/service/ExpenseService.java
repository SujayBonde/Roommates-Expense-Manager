package com.roommate.expense.service;

import com.roommate.expense.dto.CreateExpenseRequest;
import com.roommate.expense.dto.ExpenseParticipantDTO;
import com.roommate.expense.dto.ExpenseResponse;
import com.roommate.expense.dto.ParticipantShareDTO;
import com.roommate.expense.entity.Expense;
import com.roommate.expense.entity.ExpenseParticipant;
import com.roommate.expense.entity.Household;
import com.roommate.expense.entity.HouseholdMember;
import com.roommate.expense.entity.User;
import com.roommate.expense.enums.ActivityType;
import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.enums.NotificationType;
import com.roommate.expense.exception.BadRequestException;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.exception.ResourceNotFoundException;
import com.roommate.expense.repository.ExpenseParticipantRepository;
import com.roommate.expense.repository.ExpenseRepository;
import com.roommate.expense.repository.HouseholdMemberRepository;
import com.roommate.expense.repository.HouseholdRepository;
import com.roommate.expense.repository.UserRepository;
import com.roommate.expense.util.SplitCalculator;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseParticipantRepository participantRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final SplitCalculator splitCalculator;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request, Long currentUserId) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        validateMembership(household.getId(), currentUserId);

        User paidBy = userRepository.findById(request.getPaidById())
                .orElseThrow(() -> new ResourceNotFoundException("Payer user not found"));

        validateMembership(household.getId(), paidBy.getId());

        // Validate all participants are members of the household
        for (ParticipantShareDTO p : request.getParticipants()) {
            if (!memberRepository.existsByHouseholdIdAndUserId(household.getId(), p.getUserId())) {
                throw new BadRequestException("Participant user " + p.getUserId() + " is not a member of this household");
            }
        }

        // Calculate exact shares using SplitCalculator
        Map<Long, BigDecimal> calculatedShares = splitCalculator.calculateShares(
                request.getAmount(),
                request.getSplitType(),
                request.getParticipants()
        );

        Expense expense = Expense.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .totalAmount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                .splitType(request.getSplitType())
                .category(request.getCategory())
                .paidBy(paidBy)
                .household(household)
                .expenseDate(request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now())
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // Build participants list
        Map<Long, ParticipantShareDTO> inputMap = request.getParticipants().stream()
                .collect(Collectors.toMap(ParticipantShareDTO::getUserId, p -> p, (a, b) -> a));

        List<ExpenseParticipant> participantEntities = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : calculatedShares.entrySet()) {
            Long participantId = entry.getKey();
            BigDecimal share = entry.getValue();
            User user = userRepository.findById(participantId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + participantId));

            ParticipantShareDTO input = inputMap.get(participantId);

            ExpenseParticipant participant = ExpenseParticipant.builder()
                    .expense(savedExpense)
                    .user(user)
                    .shareAmount(share)
                    .shareValue(input != null ? input.getShareValue() : null)
                    .isPaid(paidBy.getId().equals(user.getId()))
                    .build();

            participantEntities.add(participant);
        }

        participantRepository.saveAll(participantEntities);
        savedExpense.setParticipants(participantEntities);

        // Log activity
        activityLogService.logActivity(
                household,
                paidBy,
                ActivityType.EXPENSE_CREATED,
                paidBy.getName() + " added \"" + savedExpense.getTitle() + "\" (₹" + savedExpense.getTotalAmount() + ")"
        );

        // Notify participants (except payer)
        for (ExpenseParticipant participant : participantEntities) {
            if (!participant.getUser().getId().equals(paidBy.getId())) {
                notificationService.createNotification(
                        participant.getUser(),
                        String.format("You were included in expense \"%s\" for ₹%s (Paid by %s)",
                                savedExpense.getTitle(), participant.getShareAmount(), paidBy.getName()),
                        NotificationType.EXPENSE_ADDED,
                        savedExpense.getId()
                );
            }
        }

        return mapToResponse(savedExpense, currentUserId);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> getExpenses(
            Long householdId,
            CategoryType category,
            Long paidById,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable,
            Long currentUserId) {

        validateMembership(householdId, currentUserId);

        Specification<Expense> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), householdId));

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (paidById != null) {
                predicates.add(cb.equal(root.get("paidBy").get("id"), paidById));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("expenseDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("expenseDate"), endDate));
            }
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort existingSort = pageable.getSort();
        Sort effectiveSort = existingSort.isSorted()
                ? existingSort.and(Sort.by(Sort.Direction.DESC, "createdAt", "id"))
                : Sort.by(Sort.Direction.DESC, "expenseDate", "createdAt", "id");

        Pageable effectivePageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                effectiveSort
        );

        return expenseRepository.findAll(spec, effectivePageable)
                .map(expense -> mapToResponse(expense, currentUserId));
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long id, Long currentUserId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        validateMembership(expense.getHousehold().getId(), currentUserId);

        return mapToResponse(expense, currentUserId);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long id, CreateExpenseRequest request, Long currentUserId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        validateMembership(expense.getHousehold().getId(), currentUserId);
        validateCanModify(expense, currentUserId);

        User paidBy = userRepository.findById(request.getPaidById())
                .orElseThrow(() -> new ResourceNotFoundException("Payer user not found"));

        validateMembership(expense.getHousehold().getId(), paidBy.getId());

        // Validate participants
        for (ParticipantShareDTO p : request.getParticipants()) {
            if (!memberRepository.existsByHouseholdIdAndUserId(expense.getHousehold().getId(), p.getUserId())) {
                throw new BadRequestException("Participant " + p.getUserId() + " is not in household");
            }
        }

        Map<Long, BigDecimal> calculatedShares = splitCalculator.calculateShares(
                request.getAmount(),
                request.getSplitType(),
                request.getParticipants()
        );

        expense.setTitle(request.getTitle().trim());
        expense.setDescription(request.getDescription());
        expense.setTotalAmount(request.getAmount().setScale(2, RoundingMode.HALF_UP));
        expense.setSplitType(request.getSplitType());
        expense.setCategory(request.getCategory());
        expense.setPaidBy(paidBy);
        if (request.getExpenseDate() != null) {
            expense.setExpenseDate(request.getExpenseDate());
        }

        // Replace participants
        participantRepository.deleteByExpenseId(expense.getId());

        Map<Long, ParticipantShareDTO> inputMap = request.getParticipants().stream()
                .collect(Collectors.toMap(ParticipantShareDTO::getUserId, p -> p, (a, b) -> a));

        List<ExpenseParticipant> newParticipants = new ArrayList<>();
        for (Map.Entry<Long, BigDecimal> entry : calculatedShares.entrySet()) {
            User user = userRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + entry.getKey()));

            ParticipantShareDTO input = inputMap.get(entry.getKey());

            ExpenseParticipant p = ExpenseParticipant.builder()
                    .expense(expense)
                    .user(user)
                    .shareAmount(entry.getValue())
                    .shareValue(input != null ? input.getShareValue() : null)
                    .isPaid(paidBy.getId().equals(user.getId()))
                    .build();

            newParticipants.add(p);
        }

        participantRepository.saveAll(newParticipants);
        expense.setParticipants(newParticipants);

        Expense updatedExpense = expenseRepository.save(expense);

        activityLogService.logActivity(
                expense.getHousehold(),
                userRepository.findById(currentUserId).orElse(paidBy),
                ActivityType.EXPENSE_UPDATED,
                "Expense \"" + updatedExpense.getTitle() + "\" was updated"
        );

        return mapToResponse(updatedExpense, currentUserId);
    }

    @Transactional
    public void deleteExpense(Long id, Long currentUserId) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));

        validateMembership(expense.getHousehold().getId(), currentUserId);
        validateCanModify(expense, currentUserId);

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        activityLogService.logActivity(
                expense.getHousehold(),
                currentUser,
                ActivityType.EXPENSE_DELETED,
                currentUser.getName() + " deleted expense \"" + expense.getTitle() + "\" (₹" + expense.getTotalAmount() + ")"
        );

        expenseRepository.delete(expense);
    }

    private void validateMembership(Long householdId, Long userId) {
        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, userId)) {
            throw new ForbiddenException("You do not have access to this household");
        }
    }

    private void validateCanModify(Expense expense, Long userId) {
        boolean isPayer = expense.getPaidBy().getId().equals(userId);
        HouseholdMember member = memberRepository.findByHouseholdIdAndUserId(expense.getHousehold().getId(), userId)
                .orElseThrow(() -> new ForbiddenException("Not a member"));

        if (!isPayer && !member.isAdmin()) {
            throw new ForbiddenException("Only the payer or a household admin can modify or delete this expense");
        }
    }

    public ExpenseResponse mapToResponse(Expense expense, Long currentUserId) {
        List<ExpenseParticipantDTO> participantDTOs = expense.getParticipants().stream()
                .map(p -> {
                    boolean isPayer = p.getUser().getId().equals(expense.getPaidBy().getId());
                    BigDecimal paidAmount = isPayer ? expense.getTotalAmount() : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                    BigDecimal netBalance = paidAmount.subtract(p.getShareAmount()).setScale(2, RoundingMode.HALF_UP);

                    return ExpenseParticipantDTO.builder()
                            .id(p.getId())
                            .userId(p.getUser().getId())
                            .userName(p.getUser().getName())
                            .userEmail(p.getUser().getEmail())
                            .shareAmount(p.getShareAmount())
                            .paidAmount(paidAmount)
                            .netBalance(netBalance)
                            .shareValue(p.getShareValue())
                            .isPaid(p.isPaid())
                            .build();
                })
                .collect(Collectors.toList());

        BigDecimal myShare = participantDTOs.stream()
                .filter(p -> p.getUserId().equals(currentUserId))
                .map(ExpenseParticipantDTO::getShareAmount)
                .findFirst()
                .orElse(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .description(expense.getDescription())
                .amount(expense.getTotalAmount())
                .splitType(expense.getSplitType())
                .category(expense.getCategory())
                .paidById(expense.getPaidBy().getId())
                .paidByName(expense.getPaidBy().getName())
                .paidByEmail(expense.getPaidBy().getEmail())
                .householdId(expense.getHousehold().getId())
                .householdName(expense.getHousehold().getName())
                .expenseDate(expense.getExpenseDate())
                .participants(participantDTOs)
                .myShare(myShare)
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
