import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

public class AuthLoginTest {

    @BeforeAll
    static void setup() {
        // Points to your NestJS server
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = 3000;
    }

    @Test
    @DisplayName("Test Login with Empty Password - Should Fail with 401")
    void testLoginWithEmptyPassword() {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", "john@email.com");
        payload.put("password", ""); // Empty password

        given()
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/auth/login")
        .then()
            .statusCode(401) 
            .body("message", equalTo("Unauthorized"));
    }

    @Test
    @DisplayName("Test Login with Missing Email - Should Fail with 401")
    void testLoginWithEmptyEmail() {
        Map<String, String> payload = new HashMap<>();
        payload.put("email", ""); // Empty email
        payload.put("password", "changeme");

        given()
            .contentType(ContentType.JSON)
            .body(payload)
        .when()
            .post("/auth/login")
        .then()
            .statusCode(401);
    }
}