package com.lab08.service;

import com.lab08.model.FileEntity;
import com.lab08.model.User;
import com.lab08.repository.FileRepository;
import com.lab08.repository.UserRepository;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
@Epic("Storage")
@Feature("Quota & Isolation")
class QuotaTest {

    static final long MB = 1_048_576L;

    @Autowired StorageService storage;
    @Autowired UserRepository users;
    @Autowired FileRepository files;

    @Test
    void newUserGets50MbAndFormulaHolds() {
        User u = users.save(new User("sok@itc.edu", "Sok", "pw"));
        
        // 1. EQUALS
        assertThat(u.getQuotaBytes()).isEqualTo(50 * MB);

        storage.upload(u, "doc1.txt", 10 * MB);
        storage.upload(u, "doc2.txt", 15 * MB);

        // 2. FORMULA
        long free = u.getQuotaBytes() - (25 * MB);
        assertThat(storage.freeBytes(u)).isEqualTo(free);

        // 3. EXCEPTION
        assertThrows(QuotaExceededException.class, 
            () -> storage.upload(u, "big.zip", 40 * MB));

        // 4. TOLERANCE (delta)
        double usedInMB = (double) u.getUsedBytes() / MB;
        assertThat(usedInMB).isCloseTo(25.0, within(0.1));

        // 5. PREDICATE
        assertThat(u).matches(x -> x.getUsedBytes() <= x.getQuotaBytes(), "Used bytes <= Quota");
    }

    @Test
    void usersCannotSeeEachOther() {
        User a = users.save(new User("a@itc.edu", "A", "pw"));
        User b = users.save(new User("b@itc.edu", "B", "pw"));
        
        storage.upload(a, "secret.txt", 100);

        List<String> bFiles = storage.listUserFiles(b).stream()
                .map(FileEntity::getName).collect(Collectors.toList());
        
        // 6. COLLECTION (Isolation check)
        assertThat(bFiles).doesNotContain("secret.txt").isEmpty();
    }
}