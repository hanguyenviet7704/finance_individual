package com.finance.fraud.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FraudController.class)
public class FraudControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/fraud/history - Should return 200 OK")
    void testGetFraudHistory_Success() throws Exception {
        mockMvc.perform(get("/api/v1/fraud/history")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
