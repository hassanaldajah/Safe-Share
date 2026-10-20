package com.motasem.safeshare;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Starts the whole application, so it needs PostgreSQL and the usual environment (JWT_SECRET, DB_URL).
 * Skipped by default; run it with RUN_INTEGRATION_TESTS=true.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_INTEGRATION_TESTS", matches = "true")
class SafeshareApplicationTests {

	@Test
	void contextLoads() {
	}

}
