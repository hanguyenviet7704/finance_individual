package com.finance.fraud.engine;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.function.Predicate;

@Getter
@AllArgsConstructor
public class FraudRule {
    private final String name;
    private final int weight;
    private final Predicate<FraudContext> condition;

    public boolean evaluate(FraudContext context) {
        return condition.test(context);
    }
}
