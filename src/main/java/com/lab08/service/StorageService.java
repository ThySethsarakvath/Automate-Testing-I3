package com.lab08.service;

import com.lab08.model.FileEntity;
import com.lab08.model.User;
import com.lab08.repository.FileRepository;
import com.lab08.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StorageService {
    
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FileRepository fileRepository;

    public FileEntity upload(User user, String fileName, long sizeBytes) {
        if (user.getUsedBytes() + sizeBytes > user.getQuotaBytes()) {
            throw new QuotaExceededException("Quota exceeded");
        }
        user.setUsedBytes(user.getUsedBytes() + sizeBytes);
        userRepository.save(user);
        
        FileEntity file = new FileEntity(user.getId(), null, fileName, sizeBytes);
        return fileRepository.save(file);
    }

    public long freeBytes(User user) {
        return user.getQuotaBytes() - user.getUsedBytes();
    }

    public List<FileEntity> listUserFiles(User user) {
        return fileRepository.findByOwnerId(user.getId());
    }
}