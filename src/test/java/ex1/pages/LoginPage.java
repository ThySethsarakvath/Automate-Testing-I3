package ex1.pages;

import com.microsoft.playwright.Page;

public class LoginPage {
    private final Page page;

    // 1. Locators (Strings/Selectors)
    private final String usernameInput = "id=user-name";
    private final String passwordInput = "id=password";
    private final String loginButton = "id=login-button";

    public LoginPage(Page page) {
        this.page = page;
    }

    // 2. Actions
    public void login(String user, String pass) {
        page.fill(usernameInput, user);
        page.fill(passwordInput, pass);
        page.click(loginButton);
    }
}
