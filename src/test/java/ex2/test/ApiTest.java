package ex2.test;

import io.restassured.RestAssured;
import io.restassured.module.jsv.JsonSchemaValidator;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;
import java.io.File;

public class ApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://jsonplaceholder.typicode.com";
    }

    @Test
    public void testGetUserAndValidateSchema() {
        // Path to your schema file
        File schema = new File("src/test/resources/user-schema.json");

        given()
            .header("Content-Type", "application/json")
        .when()
            .get("/users/1")
        .then()
            .statusCode(200)
            // 1. Detailed Reporting (via logs)
            .log().all() 
            // 2. Data Validation
            .body("name", equalTo("Leanne Graham"))
            .body("email", containsString("@"))
            // 3. Schema Validation
            .body(JsonSchemaValidator.matchesJsonSchema(schema));
        
        System.out.println("API Test Passed: Data and Schema are valid!");
    }
}