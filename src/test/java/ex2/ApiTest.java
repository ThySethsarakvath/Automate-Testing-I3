package ex2;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

import static io.restassured.RestAssured.*;
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;
import static org.hamcrest.Matchers.*;

public class ApiTest {

    @BeforeClass
    public void setup() {
        RestAssured.baseURI = "https://reqres.in/api";
    }

    @DataProvider(name = "userData")
    public Object[][] getUserData() {
        return new Object[][] {
                { "Thy Vath", "Network Designer" },
                { "Sitha", "Automation Lead" },
                { "John Doe", "QA Engineer" }
        };
    }

    @Test(dataProvider = "userData")
    public void testCreateUserOnline(String name, String job) {
        String requestBody = String.format("{\"name\": \"%s\", \"job\": \"%s\"}", name, job);

        given()
                // go to https://reqres.in/ and get the API key for free user and use it in the header
                .header("x-api-key", "free_user_3D11VMHSxOrq0nFogPT5gBeOcQ6")
                .contentType(ContentType.JSON)
                .body(requestBody)
        .when()
                .post("/users")
        .then()
                .log().ifValidationFails()
                .statusCode(201)
                .body("name", equalTo(name))
                .body("job", equalTo(job))
                .body(matchesJsonSchemaInClasspath("user-schema.json"));
    }
}