package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final UserRepository userRepository;

    @Value("${stripe.apiKey:}")
    private String stripeApiKey;

    @Value("${stripe.webhookSecret:}")
    private String endpointSecret;

    @PostConstruct
    public void init() {
        if (stripeApiKey != null && !stripeApiKey.isEmpty()) {
            Stripe.apiKey = stripeApiKey;
        }
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@AuthenticationPrincipal User user) {
        try {
            SessionCreateParams params =
                    SessionCreateParams.builder()
                            .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                            .setSuccessUrl("http://localhost:5173/payment-success")
                            .setCancelUrl("http://localhost:5173/pricing")
                            .setCustomerEmail(user.getEmail())
                            .putMetadata("userId", String.valueOf(user.getId()))
                            .addLineItem(
                                    SessionCreateParams.LineItem.builder()
                                            .setQuantity(1L)
                                            .setPriceData(
                                                    SessionCreateParams.LineItem.PriceData.builder()
                                                            .setCurrency("usd")
                                                            .setUnitAmount(999L)
                                                            .setRecurring(SessionCreateParams.LineItem.PriceData.Recurring.builder().setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH).build())
                                                            .setProductData(
                                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                            .setName("Pro Plan")
                                                                            .build()
                                                            )
                                                            .build()
                                            )
                                            .build()
                            )
                            .build();

            Session session = Session.create(params);
            return ResponseEntity.ok(Map.of("url", session.getUrl()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
            if (dataObjectDeserializer.getObject().isPresent()) {
                StripeObject stripeObject = dataObjectDeserializer.getObject().get();
                if (stripeObject instanceof Session) {
                    Session session = (Session) stripeObject;
                    String userIdStr = session.getMetadata().get("userId");
                    if (userIdStr != null) {
                        try {
                            Integer userId = Integer.parseInt(userIdStr);
                            User user = userRepository.findById(userId).orElse(null);
                            if (user != null) {
                                user.setRole("PRO_USER");
                                userRepository.save(user);
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }
        }
        return ResponseEntity.ok("Success");
    }
}
