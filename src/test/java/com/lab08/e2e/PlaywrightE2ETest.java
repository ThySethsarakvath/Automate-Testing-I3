package com.lab08.e2e;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.microsoft.playwright.*;
import com.microsoft.playwright.options.RequestOptions;

import io.qameta.allure.Allure;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Feature("API & Visual Contracts")
class PlaywrightE2ETest {

    @LocalServerPort
    private int port;

    static Playwright playwright;
    static Browser browser;
    APIRequestContext request;

    @BeforeAll
    static void init() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @AfterAll
    static void close() {
        playwright.close();
    }

    @BeforeEach
    void setUpContext() {
        request = playwright.request().newContext(
            new APIRequest.NewContextOptions().setBaseURL("http://localhost:" + port)
        );
        
        // Seed a user for the tests
        Map<String, String> data = new HashMap<>();
        data.put("email", "test@test.com");
        data.put("displayName", "TestUser");
        data.put("password", "secret");
        request.post("/api/auth/register", RequestOptions.create().setData(data));
    }

    @Test
    void profileEndpointContract() {
        APIResponse res = request.get("/api/me?email=test@test.com");
        assertThat(res.status()).isEqualTo(200);

        JsonObject body = JsonParser.parseString(res.text()).getAsJsonObject();

        // 7. SCHEMA
        assertThat(body.has("email")).isTrue();
        
        // 8. REGEX
        assertThat(body.get("email").getAsString()).matches("^[\\w.+-]+@[\\w.-]+$");
        
        // 9. CONTAINS
        String foldersStr = body.getAsJsonArray("folders").toString();
        assertThat(foldersStr).contains("Documents");
    }

    @Test
    void visualSnapshotTest() {
        Page page = browser.newPage();
        // Since we don't have a full UI, we'll navigate to the auto-generated H2 console 
        // to prove Playwright browser automation & attachment works.
        page.navigate("http://localhost:" + port + "/h2-console");
        
        // 10. VISUAL
        byte[] screenshot = page.screenshot();
        Allure.addAttachment("H2 Console Login", "image/png", 
            new ByteArrayInputStream(screenshot), ".png");
            
        assertThat(screenshot).isNotEmpty();
    }
}