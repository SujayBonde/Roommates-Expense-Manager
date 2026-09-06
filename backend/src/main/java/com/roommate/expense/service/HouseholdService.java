package com.roommate.expense.service;

import com.roommate.expense.dto.CreateHouseholdRequest;
import com.roommate.expense.dto.HouseholdResponse;
import com.roommate.expense.dto.JoinHouseholdRequest;
import com.roommate.expense.dto.MemberResponse;
import com.roommate.expense.entity.Household;
import com.roommate.expense.entity.HouseholdMember;
import com.roommate.expense.entity.User;
import com.roommate.expense.enums.ActivityType;
import com.roommate.expense.enums.NotificationType;
import com.roommate.expense.exception.BadRequestException;
import com.roommate.expense.exception.ForbiddenException;
import com.roommate.expense.exception.ResourceNotFoundException;
import com.roommate.expense.repository.HouseholdMemberRepository;
import com.roommate.expense.repository.HouseholdRepository;
import com.roommate.expense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public HouseholdResponse createHousehold(CreateHouseholdRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String inviteCode = generateUniqueInviteCode();

        Household household = Household.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .inviteCode(inviteCode)
                .createdBy(user)
                .build();

        Household savedHousehold = householdRepository.save(household);

        HouseholdMember member = HouseholdMember.builder()
                .household(savedHousehold)
                .user(user)
                .isAdmin(true)
                .joinedAt(LocalDateTime.now())
                .build();

        memberRepository.save(member);

        activityLogService.logActivity(
                savedHousehold,
                user,
                ActivityType.HOUSEHOLD_CREATED,
                user.getName() + " created household \"" + savedHousehold.getName() + "\""
        );

        return mapToResponse(savedHousehold, userId);
    }

    @Transactional
    public HouseholdResponse joinHousehold(JoinHouseholdRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String code = request.getInviteCode().trim().toUpperCase(Locale.ROOT);
        Household household = householdRepository.findByInviteCode(code)
                .orElseThrow(() -> new BadRequestException("Invalid invite code: " + code));

        if (memberRepository.existsByHouseholdIdAndUserId(household.getId(), userId)) {
            throw new BadRequestException("You are already a member of this household");
        }

        HouseholdMember member = HouseholdMember.builder()
                .household(household)
                .user(user)
                .isAdmin(false)
                .joinedAt(LocalDateTime.now())
                .build();

        memberRepository.save(member);

        activityLogService.logActivity(
                household,
                user,
                ActivityType.MEMBER_JOINED,
                user.getName() + " joined the household"
        );

        // Notify existing members
        List<HouseholdMember> existingMembers = memberRepository.findByHouseholdId(household.getId());
        for (HouseholdMember existing : existingMembers) {
            if (!existing.getUser().getId().equals(userId)) {
                notificationService.createNotification(
                        existing.getUser(),
                        user.getName() + " joined " + household.getName(),
                        NotificationType.MEMBER_JOINED,
                        household.getId()
                );
            }
        }

        return mapToResponse(household, userId);
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getHouseholdById(Long id, Long userId) {
        validateMembership(id, userId);
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found with id: " + id));

        return mapToResponse(household, userId);
    }

    @Transactional(readOnly = true)
    public List<HouseholdResponse> getUserHouseholds(Long userId) {
        return householdRepository.findHouseholdsByUserId(userId).stream()
                .map(h -> mapToResponse(h, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> getHouseholdMembers(Long householdId, Long userId) {
        validateMembership(householdId, userId);
        return memberRepository.findByHouseholdId(householdId).stream()
                .map(this::mapMemberToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void leaveHousehold(Long householdId, Long userId) {
        validateMembership(householdId, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        HouseholdMember member = memberRepository.findByHouseholdIdAndUserId(householdId, userId)
                .orElseThrow(() -> new BadRequestException("Member record not found"));

        List<HouseholdMember> allMembers = memberRepository.findByHouseholdId(householdId);
        if (member.isAdmin() && allMembers.size() > 1) {
            // Transfer admin to next member
            allMembers.stream()
                    .filter(m -> !m.getUser().getId().equals(userId))
                    .findFirst()
                    .ifPresent(nextAdmin -> {
                        nextAdmin.setAdmin(true);
                        memberRepository.save(nextAdmin);
                    });
        }

        memberRepository.delete(member);

        activityLogService.logActivity(
                household,
                user,
                ActivityType.MEMBER_LEFT,
                user.getName() + " left the household"
        );
    }

    @Transactional
    public void removeMember(Long householdId, Long targetUserId, Long requestUserId) {
        validateMembership(householdId, requestUserId);

        HouseholdMember requester = memberRepository.findByHouseholdIdAndUserId(householdId, requestUserId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this household"));

        if (!requester.isAdmin()) {
            throw new ForbiddenException("Only household admins can remove members");
        }

        if (targetUserId.equals(requestUserId)) {
            throw new BadRequestException("Cannot remove yourself. Use leave household instead.");
        }

        HouseholdMember targetMember = memberRepository.findByHouseholdIdAndUserId(householdId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this household"));

        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        memberRepository.delete(targetMember);

        activityLogService.logActivity(
                household,
                requester.getUser(),
                ActivityType.MEMBER_REMOVED,
                requester.getUser().getName() + " removed " + targetMember.getUser().getName() + " from the household"
        );

        notificationService.createNotification(
                targetMember.getUser(),
                "You were removed from household \"" + household.getName() + "\"",
                NotificationType.MEMBER_LEFT,
                householdId
        );
    }

    @Transactional
    public HouseholdResponse updateHousehold(Long householdId, CreateHouseholdRequest request, Long userId) {
        validateMembership(householdId, userId);
        HouseholdMember member = memberRepository.findByHouseholdIdAndUserId(householdId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a member"));

        if (!member.isAdmin()) {
            throw new ForbiddenException("Only household admins can update settings");
        }

        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        household.setName(request.getName().trim());
        if (request.getDescription() != null) {
            household.setDescription(request.getDescription().trim());
        }

        return mapToResponse(householdRepository.save(household), userId);
    }

    @Transactional
    public String regenerateInviteCode(Long householdId, Long userId) {
        validateMembership(householdId, userId);
        HouseholdMember member = memberRepository.findByHouseholdIdAndUserId(householdId, userId)
                .orElseThrow(() -> new ForbiddenException("Not a member"));

        if (!member.isAdmin()) {
            throw new ForbiddenException("Only household admins can regenerate invite code");
        }

        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new ResourceNotFoundException("Household not found"));

        String newCode = generateUniqueInviteCode();
        household.setInviteCode(newCode);
        householdRepository.save(household);

        return newCode;
    }

    public void validateMembership(Long householdId, Long userId) {
        if (!memberRepository.existsByHouseholdIdAndUserId(householdId, userId)) {
            throw new ForbiddenException("You do not have access to this household");
        }
    }

    private String generateUniqueInviteCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(7);
            for (int i = 0; i < 7; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
        } while (householdRepository.existsByInviteCode(code));
        return code;
    }

    public HouseholdResponse mapToResponse(Household household, Long currentUserId) {
        List<HouseholdMember> members = memberRepository.findByHouseholdId(household.getId());
        List<MemberResponse> memberResponses = members.stream()
                .map(this::mapMemberToResponse)
                .collect(Collectors.toList());

        return HouseholdResponse.builder()
                .id(household.getId())
                .name(household.getName())
                .description(household.getDescription())
                .inviteCode(household.getInviteCode())
                .createdById(household.getCreatedBy().getId())
                .createdByName(household.getCreatedBy().getName())
                .membersCount(members.size())
                .members(memberResponses)
                .createdAt(household.getCreatedAt())
                .build();
    }

    public MemberResponse mapMemberToResponse(HouseholdMember member) {
        return MemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .name(member.getUser().getName())
                .email(member.getUser().getEmail())
                .profileImage(member.getUser().getProfileImage())
                .isAdmin(member.isAdmin())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
