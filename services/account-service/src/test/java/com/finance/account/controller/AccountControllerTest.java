package com.finance.account.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

// import com.finance.account.service.AccountService; // TODO: Import correct service

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
public class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // TODO: Add all required @MockBean dependencies for AccountController
    // @MockBean
    // private AccountService accountService;

    @Test
    @DisplayName("GET /api/v1/accounts - Should return 200 OK")
    void testGetAllAccounts_Success() throws Exception {
        // GIVEN
        // TODO: mock service response

        // WHEN & THEN
        mockMvc.perform(get("/api/v1/accounts")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/accounts/{id} - Should return 200 OK or 404")
    void testGetAccountById() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
