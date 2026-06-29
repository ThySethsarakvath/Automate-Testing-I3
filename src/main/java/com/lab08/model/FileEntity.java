package com.lab08.model;

import jakarta.persistence.*;

@Entity
public class FileEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private Long folderId;
    private String name;
    private long sizeBytes;

    public FileEntity() {}
    public FileEntity(Long ownerId, Long folderId, String name, long sizeBytes) {
        this.ownerId = ownerId;
        this.folderId = folderId;
        this.name = name;
        this.sizeBytes = sizeBytes;
    }
    public String getName() { return name; }
    public long getSizeBytes() { return sizeBytes; }
    public Long getOwnerId() { return ownerId; }
}