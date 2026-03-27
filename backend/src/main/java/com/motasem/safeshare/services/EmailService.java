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
        message.setSubject("SafeShare - Your Verification Code");
        message.setText("Welcome back to SafeShare!\n\n" +
                "Your 6-digit verification code is: " + otpCode + "\n\n" +
                "This code will expire in 10 minutes.\n" +
                "If you did not request this, please secure your account immediately.");

        mailSender.send(message);
    }
}