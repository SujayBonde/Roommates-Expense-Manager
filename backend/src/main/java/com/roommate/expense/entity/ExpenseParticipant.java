package com.roommate.expense.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "expense_participants",
        uniqueConstraints = @UniqueConstraint(columnNames = {"expense_id", "user_id"}),
        indexes = {
            @Index(name = "idx_participant_expense", columnList = "expense_id"),
            @Index(name = "idx_participant_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "share_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shareAmount;

    @Column(name = "share_value", precision = 12, scale = 2)
    private BigDecimal shareValue;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private boolean isPaid = false;
}
