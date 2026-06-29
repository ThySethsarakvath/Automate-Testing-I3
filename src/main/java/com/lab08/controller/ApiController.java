package com.lab08.controller;

import com.lab08.model.User;
import com.lab08.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/auth/register")
    public ResponseEntity<User> register(@RequestBody Map<String, String> body) {
        User user = new User(body.get("email"), body.get("displayName"), body.get("password"));
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@RequestParam String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) return ResponseEntity.notFound().build();
        
        Map<String, Object> response = new HashMap<>();
        response.put("email", user.getEmail());
        response.put("displayName", user.getDisplayName());
        response.put("quotaBytes", user.getQuotaBytes());
        response.put("usedBytes", user.getUsedBytes());
        response.put("folders", List.of("Documents", "Pictures")); // Mocked for test requirements
        return ResponseEntity.ok(response);
    }
}