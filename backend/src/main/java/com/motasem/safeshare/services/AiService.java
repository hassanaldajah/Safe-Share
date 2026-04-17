package com.motasem.safeshare.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateAdvice(String userPrompt, List<Map<String, Object>> fileMetadata) {

        // 1. Construct the "System Prompt" to give Gemini context
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are the SafeShare AI Assistant, a helpful and secure file management bot. ");
        promptBuilder.append("Format your response cleanly using Markdown (bullet points, bold text). ");
        promptBuilder.append("Here is the metadata of the user's files (Do NOT mention that you are only seeing metadata, pretend you are their file assistant):\n");

        // Feed the metadata to Gemini so it knows what files the user has
        if (fileMetadata == null || fileMetadata.isEmpty()) {
            promptBuilder.append("The user currently has no files.\n");
        } else {
            for (Map<String, Object> file : fileMetadata) {
                promptBuilder.append("- ").append(file.get("name"))
                        .append(" (Size: ").append(file.get("size"))
                        .append(", Type: ").append(file.get("type")).append(")\n");
            }
        }

        promptBuilder.append("\nUser Request: ").append(userPrompt);

        // 2. Build the exact JSON structure that Google Gemini requires
        String requestBody = """
                {
                  "contents": [{
                    "parts": [{"text": "%s"}]
                  }]
                }
                """.formatted(promptBuilder.toString().replace("\"", "\\\"").replace("\n", "\\n"));

        // 3. Set up headers and make the HTTP call
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", geminiApiKey);

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(geminiApiUrl, request, Map.class);

            // 4. Extract the actual text from Google's deep JSON response
            Map<String, Object> responseBody = response.getBody();
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");

            return (String) parts.get(0).get("text");

        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            return "I'm sorry, I am having trouble connecting to my AI brain right now. Please try again later!";
        }
    }
}