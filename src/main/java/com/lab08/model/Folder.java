package com.lab08.model;

import jakarta.persistence.*;

@Entity
public class Folder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long ownerId;
    private String name;
    private Long parentId;

    public Folder() {}
    public Folder(Long ownerId, String name, Long parentId) {
        this.ownerId = ownerId;
        this.name = name;
        this.parentId = parentId;
    }
    public String getName() { return name; }
    public Long getOwnerId() { return ownerId; }
}