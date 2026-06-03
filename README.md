
---

```markdown
# Lab 06 — Load Testing with Gatling (Browse and Search API)

## 📌 Overview & Objectives
This repository contains the complete performance and load-testing automation suite for **Lab 06**. The goal of this lab is to move away from heavy, traditional thread-per-user testing tools (like JMeter) and utilize an asynchronous, event-driven framework (**Gatling** via Netty and Akka) to evaluate system behavior under high concurrent load. 

### Core Objectives Met:
- Modeled user behavior using the **Gatling Scala DSL**.
- Developed a data-driven test utilizing a looping data feeder strategy.
- Implemented robust **Checks** to validate HTTP statuses and parse dynamic payload values to prevent false positives.
- Designed a realistic **Injection Profile** (closed/open concurrent traffic models) containing ramp-up and steady-state holding durations.
- Established automated **SLA Gates (Assertions)** to automatically fail the build if performance metrics degrade.

---

## 🛠️ Project Structure & Setup
The project uses the standard Maven architecture to maintain code-centric configurations under strict version control:

```text
gatling-load-test/
├── src/
│   └── test/
│       ├── scala/
│       │   └── ComputerDatabaseSimulation.scala  # Main load test script
│       └── resources/
│           └── search_terms.csv                 # Test data for feeders
├── target/
│   └── gatling/                                 # Generated HTML reports
└── pom.xml                                      # Dependencies & archetype setup

```

---

## 💻 Implementation Process

### Step 1: Protocol Configuration

We established a shared configuration defining the primary target infrastructure base URL, setting baseline HTTP response rules, and defining global headers.

```scala
val httpProtocol = http
  .baseUrl("[https://computer-database.gatling.io](https://computer-database.gatling.io)") // Target host environment
  .acceptHeader("application/json")
  .contentTypeHeader("application/json")
  .userAgentHeader("Gatling/LoadTest")

```

### Step 2: Feeders & Data-Driven Logic

To eliminate the caching effects of a single server-side query and mirror genuine user profiles, a CSV file was wired into the scenario utilizing a circular distribution profile:

```scala
val searchFeeder = csv("search_terms.csv").circular

```

### Step 3: Scenario Design & Dynamic Chaining

We built a multi-stage transaction model representing a real-world journey (`List Users` $\rightarrow$ `Search User` $\rightarrow$ `View Detail`). Every action features independent verification check blocks and variable user pacing:

1. **List Users:** Calls the index list endpoint and validates successful operational codes (`200 OK`).
2. **Search User:** Consumes distinct dynamic parameters via the feeder pipeline and extracts response entity identities using JSON paths, storing values dynamically inside the active session context via `.saveAs()`.
3. **View Detail:** Resolves target routes dynamically by re-injecting variables extracted from previous steps using Gatling expression notations (`#{compId}`).

### Step 4: Traffic Profile Shaping

The injection model was composed explicitly to structure load progression over a controlled timeline:

* **Ramp Profile:** Smoothly scales virtual users from baseline up to 100 concurrent workers over a 30-second initialization horizon.
* **Holding Period:** Holds a constant, uniform execution floor of 100 parallel active testing agents running for 2 continuous minutes to establish sustained load patterns.

### Step 5: SLA Guardrails & Gates

Automated system assertions were configured at the base of the simulation file to ensure a rigorous exit-gating mechanism:

```scala
.assertions(
  global.responseTime.percentile3.lt(1000), // p95 response time must remain < 1000ms
  global.successfulRequests.percent.gt(99.0) // Success rate must be > 99%
)

```

---

## 🚀 Execution Command

To clean the project, compile test files, and execute the dedicated workload profile against the infrastructure stack, execute the following command:

```bash
mvn clean test-compile gatling:test -Dgatling.simulationClass=ComputerDatabaseSimulation

```

---

## 📊 Performance Analysis & Results

### 1. Console Execution Logs

The simulation ran successfully for **154 seconds**, handling sustained volumetric traffic waves with perfect execution health.

```text
================================================================================
---- Global Information --------------------------------------------------------
> request count                                       9660 (OK=9660    KO=0     )
> min response time                                     15 (OK=15      KO=-     )
> max response time                                   1184 (OK=1184    KO=-     )
> mean response time                                    86 (OK=86      KO=-     )
> std deviation                                         58 (OK=58      KO=-     )
> response time 50th percentile                         55 (OK=55      KO=-     )
> response time 75th percentile                        131 (OK=131     KO=-     )
> response time 95th percentile                        177 (OK=177     KO=-     )
> response time 99th percentile                        225 (OK=225     KO=-     )
> mean requests/sec                                  62.32 (OK=62.32   KO=-     )
================================================================================

```

#### Console Screenshot Placeholder:

![Project Screenshot](assets\results1.png)
```
.
.
.
```
![Project Screenshot](assets\results2.png)


---

### 2. SLA Assertion Verification

Both configured performance gateways evaluated perfectly, yielding a comprehensive execution success state:

* **Global p95 Threshold:** **PASSED** (Target: `< 1000ms` | Actual: `177ms`)
* **Global Error Tolerance:** **PASSED** (Target: `> 99% OK` | Actual: `100.0%` with `0` total failures)

```text
Global: 95th percentile of response time is less than 1000.0 : true (actual : 177.0)
Global: percentage of successful events is greater than 99.0 : true (actual : 100.0)

[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------

```

---

### 3. Interactive Graphical Reports

Gatling compiled all logged telemetry parameters into an integrated, interactive HTML reporting workspace.

#### Report Screenshot Placeholder:

![Project Screenshot](assets\report.png)

📥 **Click here to launch the interactive workspace:** 👉 [Open Interactive Gatling HTML Report](./target/gatling/computerdatabasesimulation-20260603062147773/index.html)


---

## 💡 Key Takeaways & Conclusions

1. **Asynchronous Scaling Efficiency:** Gatling efficiently maintained 100 concurrent active users over a prolonged test runtime with 0 system failures, handling 9,660 transactions at an average throughput of **62.32 requests per second**.
2. **Predictable Tail Latencies:** The system demonstrated outstanding stability under peak load. Even the high-tier tail latencies (**99th percentile at 225ms**) remained well below critical user-experience thresholds.
3. **CI/CD Quality Gating:** Because all assertions evaluated successfully, the runner safely terminated with exit code `0`, signifying that the infrastructure changes passed performance thresholds and are eligible for deployment pipeline promotion.

