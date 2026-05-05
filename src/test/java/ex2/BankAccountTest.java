package ex2;

import io.restassured.RestAssured;
import lab02.ex2.code.BankAccount;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

public class BankAccountTest {

    @Test
    @DisplayName("Whitebox: State Management & Path Coverage")
    void testWithdrawalLogic() {
        BankAccount account = new BankAccount(1000.0);
        
        // Successful withdrawal
        account.withdraw(200);
        assertEquals(800.0, account.getBalance());
        
        // Exception path (Insufficient funds)
        assertThrows(IllegalStateException.class, () -> account.withdraw(1000));
    }

    @Test
    @DisplayName("Blackbox: API Business Requirement Validation")
    void testAccountApiScenario() {
        // use a free mock API to simulate a "Banking Account" endpoint
        // Scenario: Validate that account details can be retrieved correctly
        
        given()
            .baseUri("https://jsonplaceholder.typicode.com")
        .when()
            .get("/users/1") 
        .then()
            .statusCode(200)
            .body("username", notNullValue())
            .body("email", containsString("@"));
    }
}