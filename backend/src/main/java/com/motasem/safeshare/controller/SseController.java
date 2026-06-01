package com.motasem.safeshare.controller;

import com.motasem.safeshare.model.User;
import com.motasem.safeshare.repository.UserRepository;
import com.motasem.safeshare.security.JwtService;
import com.motasem.safeshare.services.SseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseService sseService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@RequestParam("token") String token) {
        // Validate token and extract user
        String userEmail = jwtService.extractUsername(token);
        
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        // We use the search tag since that's what FileService uses for receiverTag
        return sseService.subscribe(user.getSearchTag());
    }
}
