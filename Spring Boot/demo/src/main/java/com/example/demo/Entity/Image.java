package com.example.demo.Entity;

import com.example.demo.Entity.enums.ImageFormat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "images")
public class Image {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false)
    private ImageFormat format;

    @Column(name = "size_gb", nullable = false)
    private Float sizeGb;

    @Column(name = "path", nullable = false)
    private String path;

    @Column(name = "driver_compat", nullable = false, columnDefinition = "json")
    private String driverCompat;

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ImageFormat getFormat() {
        return format;
    }

    public void setFormat(ImageFormat format) {
        this.format = format;
    }

    public Float getSizeGb() {
        return sizeGb;
    }

    public void setSizeGb(Float sizeGb) {
        this.sizeGb = sizeGb;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getDriverCompat() {
        return driverCompat;
    }

    public void setDriverCompat(String driverCompat) {
        this.driverCompat = driverCompat;
    }
}
