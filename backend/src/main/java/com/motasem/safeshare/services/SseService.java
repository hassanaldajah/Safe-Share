package com.motasem.safeshare.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseService {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter subscribe(String userTag) {
        // Create an emitter with a long timeout (e.g. 1 hour)
        SseEmitter emitter = new SseEmitter(60 * 60 * 1000L);
        emitters.put(userTag, emitter);

        emitter.onCompletion(() -> emitters.remove(userTag));
        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(userTag);
        });
        emitter.onError((e) -> emitters.remove(userTag));

        // Send an initial dummy event to establish the connection properly
        try {
            emitter.send(SseEmitter.event().name("init").data("connected"));
        } catch (IOException e) {
            emitters.remove(userTag);
        }

        return emitter;
    }

    public void notifyUser(String userTag, Object payload) {
        SseEmitter emitter = emitters.get(userTag);
        if (emitter != null) {
            try {
                // Convert payload to JSON string first so it sends properly formatted
                String jsonPayload = objectMapper.writeValueAsString(payload);
                emitter.send(SseEmitter.event()
                        .name("new-transaction")
                        .data(jsonPayload));
            } catch (IOException e) {
                emitters.remove(userTag);
            }
        }
    }
}
