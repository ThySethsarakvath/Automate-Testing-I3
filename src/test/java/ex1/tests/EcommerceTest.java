package ex1.tests;

import com.microsoft.playwright.*;
import ex1.pages.LoginPage;
import org.testng.annotations.*;
import java.nio.file.Paths;

public class EcommerceTest {
    Playwright playwright;
    Browser browser;
    Page page;
    LoginPage loginPage;

    @BeforeClass
    public void setup() {
        playwright = Playwright.create();
        // Set headless: false if you want to see it run on your laptop
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(false));
        page = browser.newPage();
        loginPage = new LoginPage(page);
    }

    @Test
    public void testLoginAndScreenshot() {
        page.navigate("https://www.saucedemo.com");
        
        // Use the POM action
        loginPage.login("standard_user", "secret_sauce");

        // Requirement: Add screenshot capture
        page.screenshot(new Page.ScreenshotOptions()
            .setPath(Paths.get("assets/screenshots/login-success.png")));
        
        System.out.println("Screenshot saved to assets/screenshots/login-success.png");
    }

    @AfterClass
    public void tearDown() {
        browser.close();
        playwright.close();
    }
}