package com.motasem.safeshare.controller;

import com.motasem.safeshare.services.AiService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @Data
    public static class AiChatRequest {
        private String prompt;
        private List<Map<String, Object>> files; // React will send the array of file names/sizes here
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chatWithAi(@RequestBody AiChatRequest request) {
        try {
            String aiResponseText = aiService.generateAdvice(request.getPrompt(), request.getFiles());

            // Return it as a simple JSON object
            return ResponseEntity.ok(Map.of("reply", aiResponseText));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}