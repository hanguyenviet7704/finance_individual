package com.finance.loan.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LoanController.class)
public class LoanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // TODO: Add required @MockBean dependencies

    @Test
    @DisplayName("GET /api/v1/loans - Should return 200 OK")
    void testGetAllLoans_Success() throws Exception {
        mockMvc.perform(get("/api/v1/loans")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/loans/apply - Should apply for loan and return 201 Created")
    void testApplyLoan_Success() throws Exception {
        String payload = "{\"loanType\": \"PERSONAL\", \"amount\": 50000000}";
        mockMvc.perform(post("/api/v1/loans/apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isCreated());
    }
}
