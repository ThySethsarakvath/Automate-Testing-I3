import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class ComputerDatabaseSimulation extends Simulation {

  // 1. PROTOCOL: Point to the reliable JSON test API
  val httpProtocol = http
    .baseUrl("https://jsonplaceholder.typicode.com")
    .acceptHeader("application/json")
    .userAgentHeader("Gatling/LoadTest")

  // 2. FEEDER: Use the updated names
  val searchFeeder = csv("search.csv").random

  // 3. SCENARIO: The 3-step journey using JSON endpoints
  val scn = scenario("Lab 06 - Browse and Search API")
    // Step A: List Users
    .exec(http("List Users")
      .get("/users")
      .check(status.is(200)))
    .pause(2)

    // Step B: Search for a specific user from the CSV
    .feed(searchFeeder)
    .exec(http("Search User")
      .get("/users?username=#{searchCriterion}")
      .check(status.is(200))
      // Extract the 'id' of the first user in the returned JSON array
      .check(jsonPath("$[0].id").saveAs("userId")))
    .pause(2)

    // Step C: View User Details using the dynamically captured ID
    .exec(http("View Detail")
      .get("/users/#{userId}")
      .check(status.is(200)))

  // 4. INJECTION & ASSERTIONS
  setUp(
    scn.inject(
      rampConcurrentUsers(0).to(100).during(30.seconds),
      constantConcurrentUsers(100).during(2.minutes)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.percentile3.lt(1000), // p95 < 1000ms
     global.successfulRequests.percent.gt(99)  // Success rate > 99%
   )
}