package com.motasem.safeshare.services;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("safeshare.project2026@gmail.com");
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