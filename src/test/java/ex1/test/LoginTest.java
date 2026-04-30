package ex1.test;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.Assert;
import org.testng.annotations.*;

import ex1.pages.LoginPage;

public class LoginTest {
    WebDriver driver;
    LoginPage loginPage;

    @BeforeMethod
    public void setup() {
        driver = new ChromeDriver();
        driver.get("https://www.saucedemo.com");
        loginPage = new LoginPage(driver);
    }

    @Test(dataProvider = "loginData")
    public void testUserLogin(String user, String pass) {
        loginPage.login(user, pass);
        Assert.assertTrue(driver.getCurrentUrl().contains("inventory.html"));
    }

    @DataProvider(name = "loginData")
    public Object[][] getData() {
        return new Object[][]{
            {"standard_user", "secret_sauce"},
            {"problem_user", "secret_sauce"}
        };
    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}