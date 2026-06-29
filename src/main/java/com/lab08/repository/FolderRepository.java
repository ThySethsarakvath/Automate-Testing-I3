package com.lab08.repository;
import com.lab08.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByOwnerId(Long ownerId);
}