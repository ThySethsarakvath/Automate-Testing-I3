package com.lab08.repository;
import com.lab08.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FileRepository extends JpaRepository<FileEntity, Long> {
    List<FileEntity> findByOwnerId(Long ownerId);
}