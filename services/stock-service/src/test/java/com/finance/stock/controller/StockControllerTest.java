package com.finance.stock.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(StockController.class)
public class StockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/stocks - Should return list of available markets with 200 OK")
    void testGetMarketData_Success() throws Exception {
        // WHEN
        mockMvc.perform(get("/api/v1/stocks")
                .contentType(MediaType.APPLICATION_JSON))
        // THEN
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].tickerSymbol").value("VCB"))
                .andExpect(jsonPath("$.content[1].tickerSymbol").value("HPG"));
    }

    @Test
    @DisplayName("POST /api/v1/stocks/orders - Should place an order and return 201 Created")
    void testPlaceOrder_Success() throws Exception {
        // GIVEN
        String orderPayload = """
                {
                    "tickerSymbol": "FPT",
                    "orderType": "BUY",
                    "quantity": 500,
                    "priceType": "MP"
                }
                """;

        // WHEN
        mockMvc.perform(post("/api/v1/stocks/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderPayload))
        // THEN
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tickerSymbol").value("FPT"))
                .andExpect(jsonPath("$.orderType").value("BUY"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.orderId").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/v1/stocks/portfolios/me - Should return personal portfolio with 200 OK")
    void testGetMyPortfolio_Success() throws Exception {
        // WHEN
        mockMvc.perform(get("/api/v1/stocks/portfolios/me")
                .contentType(MediaType.APPLICATION_JSON))
        // THEN
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tickerSymbol").value("HPG"))
                .andExpect(jsonPath("$[0].quantity").value(1000));
    }
}
