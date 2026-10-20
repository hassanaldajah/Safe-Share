package com.motasem.safeshare.services;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * The web hook is tested against a local fake of the Google Apps Script, which (like the real one)
 * answers a POST with a redirect to the page that holds the result.
 */
class EmailServiceTest {

    private HttpServer server;
    private String baseUrl;
    private final AtomicReference<String> received = new AtomicReference<>();
    private volatile String resultBody = "{\"ok\":true}";
    private volatile int resultStatus = 200;
    private final JavaMailSender mailSender = mock(JavaMailSender.class);

    @BeforeEach
    void startFakeScript() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
        server.createContext("/exec", exchange -> {
            received.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.getResponseHeaders().add("Location", baseUrl + "/result");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.createContext("/result", exchange -> {
            byte[] bytes = resultBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(resultStatus, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stopFakeScript() {
        server.stop(0);
    }

    private EmailService webhookService() {
        return new EmailService(mailSender, "", false, baseUrl + "/exec", "s3cret");
    }

    @Test
    void sendsThroughTheWebHookAndFollowsTheRedirect() {
        webhookService().sendOtpEmail("user@example.com", "123456");

        String body = received.get();
        assertTrue(body.contains("\"secret\":\"s3cret\""));
        assertTrue(body.contains("\"to\":\"user@example.com\""));
        assertTrue(body.contains("\"subject\":\"SafeShare - Verification Code\""));
        assertTrue(body.contains("123456"));
        verifyNoInteractions(mailSender);
    }

    @Test
    void aRefusalFromTheWebHookIsAnErrorThatDoesNotLeakTheSecret() {
        resultBody = "{\"ok\":false,\"error\":\"forbidden\"}";

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> webhookService().sendOtpEmail("user@example.com", "123456"));

        assertTrue(error.getMessage().contains("could not be sent"));
        assertFalse(error.getMessage().contains("s3cret"));
    }

    @Test
    void aServerErrorIsAnError() {
        resultStatus = 500;

        assertThrows(IllegalStateException.class, () -> webhookService().sendOtpEmail("user@example.com", "123456"));
    }

    @Test
    void anUnreachableWebHookIsAnError() {
        server.stop(0);

        assertThrows(IllegalStateException.class, () -> webhookService().sendOtpEmail("user@example.com", "123456"));
    }

    @Test
    void usesSmtpWhenThereIsNoWebHook() {
        new EmailService(mailSender, "project@gmail.com", false, "", "").sendOtpEmail("user@example.com", "123456");

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void printsTheCodeOnlyWhenNothingIsConfiguredAndTheDemoSwitchIsOn() {
        assertDoesNotThrow(() -> new EmailService(mailSender, "", true, "", "").sendOtpEmail("user@example.com", "123456"));
        verifyNoInteractions(mailSender);

        assertThrows(IllegalStateException.class,
                () -> new EmailService(mailSender, "", false, "", "").sendOtpEmail("user@example.com", "123456"));
    }

    @Test
    void jsonStringEscapesQuotesBackslashesNewlinesAndControlCharacters() {
        assertEquals("\"a\\\"b\\\\c\\nd\\u0001\"", EmailService.jsonString("a\"b\\c\nd\u0001"));
    }
}
