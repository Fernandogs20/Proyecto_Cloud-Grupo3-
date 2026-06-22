package com.example.demo.Repository;

import com.example.demo.Entity.Image;
import com.example.demo.Entity.enums.ImageFormat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImageRepository extends JpaRepository<Image, String> {
    List<Image> findByFormat(ImageFormat format);

    List<Image> findByNameContainingIgnoreCase(String name);
}
