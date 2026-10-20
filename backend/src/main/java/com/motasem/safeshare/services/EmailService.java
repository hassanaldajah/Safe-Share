package com.motasem.safeshare.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Sends the OTP e-mails. Three ways, picked in this order:
 * <ol>
 *   <li><b>Web hook</b> (MAIL_WEBHOOK_URL): an HTTPS call to a small Google Apps Script that sends the mail from a
 *       Gmail account (see docs/gmail-otp-mailer). Free, and works on hosts that block SMTP.</li>
 *   <li><b>SMTP</b> (MAIL_USERNAME / MAIL_PASSWORD): for local use and hosts that allow SMTP.</li>
 *   <li><b>Log</b> (DEV_LOG_OTP=true): prints the code in the server log. Local demos only.</li>
 * </ol>
 */
@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final boolean logOtpWhenMailIsOff;
    private final String webhookUrl;
    private final String webhookSecret;
    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL) // Google Apps Script answers through a redirect
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String fromAddress,
                        @Value("${app.dev.log-otp:false}") boolean logOtpWhenMailIsOff,
                        @Value("${app.mail.webhook-url:}") String webhookUrl,
                        @Value("${app.mail.webhook-secret:}") String webhookSecret) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.logOtpWhenMailIsOff = logOtpWhenMailIsOff;
        this.webhookUrl = webhookUrl;
        this.webhookSecret = webhookSecret;
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "SafeShare - Verification Code";
        // Generic message that works for both Sign Up and Login
        String text = "Hello from SafeShare!\n\n" +
                "Your 6-digit security code is: " + otpCode + "\n\n" +
                "This code is required to verify your identity. It will expire in 10 minutes.\n\n" +
                "If you did not request this code, please ignore this email.";

        if (!webhookUrl.isBlank()) {
            sendThroughWebhook(toEmail, subject, text);
            return;
        }

        if (fromAddress == null || fromAddress.isBlank()) {
            if (logOtpWhenMailIsOff) {
                log.warn("[DEV_LOG_OTP] E-mail is not configured. The code for {} is {}", toEmail, otpCode);
                return;
            }
            throw new IllegalStateException(
                    "E-mail is not configured on the server (set MAIL_WEBHOOK_URL, or MAIL_USERNAME and MAIL_PASSWORD).");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private void sendThroughWebhook(String to, String subject, String text) {
        String body = "{\"secret\":" + jsonString(webhookSecret)
                + ",\"to\":" + jsonString(to)
                + ",\"subject\":" + jsonString(subject)
                + ",\"text\":" + jsonString(text) + "}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(webhookUrl))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 || !response.body().replace(" ", "").contains("\"ok\":true")) {
                // Do not log the body: it can echo the request
                log.warn("The e-mail web hook refused the message (HTTP {})", response.statusCode());
                throw new IllegalStateException("The verification e-mail could not be sent. Please try again later.");
            }
        } catch (IOException e) {
            log.warn("The e-mail web hook could not be reached: {}", e.getMessage());
            throw new IllegalStateException("The verification e-mail could not be sent. Please try again later.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("The verification e-mail could not be sent. Please try again later.");
        }
    }

    /** A JSON string literal, escaped by hand so this class does not depend on a JSON library version. */
    static String jsonString(String value) {
        StringBuilder out = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.append('"').toString();
    }
}
