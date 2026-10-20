package com.motasem.safeshare.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    /** The sending account (MAIL_USERNAME). Empty when e-mail is not configured. */
    @Value("${spring.mail.username:}")
    private String fromAddress;

    /** Local demos only: when no e-mail account is set, print the OTP in the server log instead of failing. */
    @Value("${app.dev.log-otp:false}")
    private boolean logOtpWhenMailIsOff;

    public void sendOtpEmail(String toEmail, String otpCode) {
        if (fromAddress == null || fromAddress.isBlank()) {
            if (logOtpWhenMailIsOff) {
                log.warn("[DEV_LOG_OTP] E-mail is not configured. The code for {} is {}", toEmail, otpCode);
                return;
            }
            throw new IllegalStateException(
                    "E-mail is not configured on the server (set MAIL_USERNAME and MAIL_PASSWORD).");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("SafeShare - Verification Code");

        // Generic message that works for both Sign Up and Login
        message.setText("Hello from SafeShare!\n\n" +
                "Your 6-digit security code is: " + otpCode + "\n\n" +
                "This code is required to verify your identity. It will expire in 10 minutes.\n\n" +
                "If you did not request this code, please ignore this email.");

        mailSender.send(message);
    }
}
