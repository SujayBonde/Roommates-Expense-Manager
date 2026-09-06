package com.roommate.expense.util;

import com.roommate.expense.dto.CreateExpenseRequest;
import com.roommate.expense.dto.CreateLoanRequest;
import com.roommate.expense.dto.ParticipantShareDTO;
import com.roommate.expense.dto.SettlementRequest;
import com.roommate.expense.entity.Household;
import com.roommate.expense.entity.HouseholdMember;
import com.roommate.expense.entity.Role;
import com.roommate.expense.entity.User;
import com.roommate.expense.enums.CategoryType;
import com.roommate.expense.enums.RoleType;
import com.roommate.expense.enums.SplitType;
import com.roommate.expense.repository.HouseholdMemberRepository;
import com.roommate.expense.repository.HouseholdRepository;
import com.roommate.expense.repository.RoleRepository;
import com.roommate.expense.repository.UserRepository;
import com.roommate.expense.service.ExpenseService;
import com.roommate.expense.service.LoanService;
import com.roommate.expense.service.SettlementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExpenseService expenseService;
    private final LoanService loanService;
    private final SettlementService settlementService;

    @Override
    @Transactional
    public void run(String... args) {
        // Migrate existing demo accounts if present
        userRepository.findByEmail("rahul@example.com").ifPresent(u -> {
            u.setName("Sujay");
            u.setEmail("sujay@example.com");
            userRepository.save(u);
        });
        userRepository.findByEmail("amit@example.com").ifPresent(u -> {
            u.setName("Dnyaneshwar");
            u.setEmail("dnyaneshwar@example.com");
            userRepository.save(u);
        });
        userRepository.findByEmail("akash@example.com").ifPresent(u -> {
            u.setName("Vishal");
            u.setEmail("vishal@example.com");
            userRepository.save(u);
        });
        userRepository.findByEmail("sagar@example.com").ifPresent(u -> {
            u.setName("Aditya");
            u.setEmail("aditya@example.com");
            userRepository.save(u);
        });
        householdRepository.findByInviteCode("FLAT302").ifPresent(h -> {
            h.setDescription("Cozy apartment shared by Sujay, Dnyaneshwar, Vishal & Aditya");
            householdRepository.save(h);
        });

        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial data load.");
            return;
        }

        log.info("Seeding initial data for RoomMate Expense Manager...");

        // 1. Roles
        Role roleUser = roleRepository.save(Role.builder().name(RoleType.ROLE_USER).build());
        Role roleAdmin = roleRepository.save(Role.builder().name(RoleType.ROLE_ADMIN).build());

        // 2. Users: Sujay, Dnyaneshwar, Vishal, Aditya
        String encodedPassword = passwordEncoder.encode("Password@123");

        User sujay = userRepository.save(User.builder()
                .name("Sujay")
                .email("sujay@example.com")
                .password(encodedPassword)
                .profileImage("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80")
                .roles(new HashSet<>(Arrays.asList(roleUser, roleAdmin)))
                .build());

        User dnyaneshwar = userRepository.save(User.builder()
                .name("Dnyaneshwar")
                .email("dnyaneshwar@example.com")
                .password(encodedPassword)
                .profileImage("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80")
                .roles(new HashSet<>(Collections.singletonList(roleUser)))
                .build());

        User vishal = userRepository.save(User.builder()
                .name("Vishal")
                .email("vishal@example.com")
                .password(encodedPassword)
                .profileImage("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
                .roles(new HashSet<>(Collections.singletonList(roleUser)))
                .build());

        User aditya = userRepository.save(User.builder()
                .name("Aditya")
                .email("aditya@example.com")
                .password(encodedPassword)
                .profileImage("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80")
                .roles(new HashSet<>(Collections.singletonList(roleUser)))
                .build());

        // 3. Household: "Flat 302"
        Household flat302 = householdRepository.save(Household.builder()
                .name("Flat 302")
                .description("Cozy apartment shared by Sujay, Dnyaneshwar, Vishal & Aditya")
                .inviteCode("FLAT302")
                .createdBy(sujay)
                .build());

        // 4. Household Members
        memberRepository.save(HouseholdMember.builder().household(flat302).user(sujay).isAdmin(true).joinedAt(LocalDateTime.now().minusMonths(3)).build());
        memberRepository.save(HouseholdMember.builder().household(flat302).user(dnyaneshwar).isAdmin(false).joinedAt(LocalDateTime.now().minusMonths(3)).build());
        memberRepository.save(HouseholdMember.builder().household(flat302).user(vishal).isAdmin(false).joinedAt(LocalDateTime.now().minusMonths(3)).build());
        memberRepository.save(HouseholdMember.builder().household(flat302).user(aditya).isAdmin(false).joinedAt(LocalDateTime.now().minusMonths(3)).build());

        // 5. Initial Expenses
        List<ParticipantShareDTO> allFourEqual = Arrays.asList(
                new ParticipantShareDTO(sujay.getId(), null),
                new ParticipantShareDTO(dnyaneshwar.getId(), null),
                new ParticipantShareDTO(vishal.getId(), null),
                new ParticipantShareDTO(aditya.getId(), null)
        );

        // Expense 1: Groceries ₹4000 paid by Sujay (Equal split)
        expenseService.createExpense(CreateExpenseRequest.builder()
                .title("Monthly Grocery")
                .description("Supermarket haul: vegetables, pulses, spices, oil, snacks")
                .amount(new BigDecimal("4000.00"))
                .splitType(SplitType.EQUAL)
                .category(CategoryType.GROCERIES)
                .paidById(sujay.getId())
                .householdId(flat302.getId())
                .expenseDate(LocalDate.now().minusDays(10))
                .participants(allFourEqual)
                .build(), sujay.getId());

        // Expense 2: Electricity Bill ₹2400 paid by Dnyaneshwar (Equal split)
        expenseService.createExpense(CreateExpenseRequest.builder()
                .title("Electricity Bill")
                .description("Electricity board power bill for last month")
                .amount(new BigDecimal("2400.00"))
                .splitType(SplitType.EQUAL)
                .category(CategoryType.ELECTRICITY)
                .paidById(dnyaneshwar.getId())
                .householdId(flat302.getId())
                .expenseDate(LocalDate.now().minusDays(7))
                .participants(allFourEqual)
                .build(), dnyaneshwar.getId());

        // Expense 3: Internet Wi-Fi ₹1200 paid by Vishal (Equal split)
        expenseService.createExpense(CreateExpenseRequest.builder()
                .title("High-Speed Fiber Internet")
                .description("200 Mbps fiber broadband monthly recharge")
                .amount(new BigDecimal("1200.00"))
                .splitType(SplitType.EQUAL)
                .category(CategoryType.INTERNET)
                .paidById(vishal.getId())
                .householdId(flat302.getId())
                .expenseDate(LocalDate.now().minusDays(5))
                .participants(allFourEqual)
                .build(), vishal.getId());

        // Expense 4: Dinner Outing ₹1600 paid by Aditya (Equal split)
        expenseService.createExpense(CreateExpenseRequest.builder()
                .title("Weekend Dinner Outing")
                .description("Friday pizza & burgers night")
                .amount(new BigDecimal("1600.00"))
                .splitType(SplitType.EQUAL)
                .category(CategoryType.FOOD)
                .paidById(aditya.getId())
                .householdId(flat302.getId())
                .expenseDate(LocalDate.now().minusDays(2))
                .participants(allFourEqual)
                .build(), aditya.getId());

        // Expense 5: Water Purifier Service ₹1000 paid by Sujay with custom amount split
        List<ParticipantShareDTO> customShares = Arrays.asList(
                new ParticipantShareDTO(sujay.getId(), new BigDecimal("250.00")),
                new ParticipantShareDTO(dnyaneshwar.getId(), new BigDecimal("250.00")),
                new ParticipantShareDTO(vishal.getId(), new BigDecimal("250.00")),
                new ParticipantShareDTO(aditya.getId(), new BigDecimal("250.00"))
        );
        expenseService.createExpense(CreateExpenseRequest.builder()
                .title("Water Purifier Filter Replacement")
                .description("RO service & membrane replacement")
                .amount(new BigDecimal("1000.00"))
                .splitType(SplitType.EXACT)
                .category(CategoryType.HOUSEHOLD)
                .paidById(sujay.getId())
                .householdId(flat302.getId())
                .expenseDate(LocalDate.now().minusDays(1))
                .participants(customShares)
                .build(), sujay.getId());

        // 6. Sample Loan: Sujay lent Dnyaneshwar ₹500
        var loanResp = loanService.createLoan(CreateLoanRequest.builder()
                .borrowerId(dnyaneshwar.getId())
                .amount(new BigDecimal("500.00"))
                .description("Emergency cash for cab fare")
                .date(LocalDate.now().minusDays(4))
                .householdId(flat302.getId())
                .build(), sujay.getId());

        // 7. Sample Settlement: Dnyaneshwar paid Sujay ₹200 towards loan/shared expenses
        settlementService.recordSettlement(SettlementRequest.builder()
                .receiverId(sujay.getId())
                .amount(new BigDecimal("200.00"))
                .paymentDate(LocalDate.now().minusDays(1))
                .note("UPI Transfer for weekend grocery share")
                .householdId(flat302.getId())
                .build(), dnyaneshwar.getId());

        log.info("Initial seed data successfully loaded into Flat 302!");
    }
}
