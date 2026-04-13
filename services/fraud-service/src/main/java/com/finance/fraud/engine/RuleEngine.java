package com.finance.fraud.engine;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class RuleEngine {

    private final List<FraudRule> rules = List.of(
        new FraudRule("abnormal_amount", 30,
            ctx -> ctx.getUserAvgAmountLast30Days() != null
                && ctx.getAmount().compareTo(ctx.getUserAvgAmountLast30Days().multiply(BigDecimal.valueOf(3))) > 0),

        new FraudRule("unusual_hour", 20,
            ctx -> ctx.getHourOfDay() >= 1 && ctx.getHourOfDay() <= 4),

        new FraudRule("velocity_check_1h", 35,
            ctx -> ctx.getTransactionCountLast1Hour() > 10),

        new FraudRule("velocity_check_24h", 20,
            ctx -> ctx.getTransactionCountLast24Hours() > 30),

        new FraudRule("new_device", 25,
            ctx -> ctx.isNewDevice()),

        new FraudRule("new_beneficiary_high_amount", 20,
            ctx -> ctx.isNewBeneficiary()
                && ctx.getAmount().compareTo(new BigDecimal("10000000")) > 0),

        new FraudRule("blacklisted_account", 100,
            ctx -> ctx.isBeneficiaryBlacklisted()),

        new FraudRule("large_amount", 30,
            ctx -> ctx.getAmount().compareTo(new BigDecimal("100000000")) > 0)
    );

    public RuleResult evaluate(FraudContext context) {
        List<String> triggered = rules.stream()
            .filter(rule -> rule.evaluate(context))
            .map(FraudRule::getName)
            .collect(Collectors.toList());

        int score = rules.stream()
            .filter(rule -> rule.evaluate(context))
            .mapToInt(FraudRule::getWeight)
            .sum();

        // Cap tại 100
        int finalScore = Math.min(score, 100);

        return new RuleResult(finalScore, triggered);
    }

    public record RuleResult(int score, List<String> triggeredRules) {}
}
