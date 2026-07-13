package com.example.demo.Entity;

import com.example.demo.Entity.enums.DriverType;
import com.example.demo.Entity.enums.VmStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vms")
public class VirtualMachine {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "slice_id", nullable = false)
    private Slice slice;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "image_id", nullable = false)
    private Image image;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private Server host;

    @Enumerated(EnumType.STRING)
    @Column(name = "driver", nullable = false)
    private DriverType driver;

    @Column(name = "cpu", nullable = false)
    private Integer cpu;

    @Column(name = "ram_mb", nullable = false)
    private Integer ramMb;

    @Column(name = "disk_gb", nullable = false)
    private Integer diskGb;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private VmStatus status;

    @Column(name = "console_token")
    private String consoleToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

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

    public Slice getSlice() {
        return slice;
    }

    public void setSlice(Slice slice) {
        this.slice = slice;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Image getImage() {
        return image;
    }

    public void setImage(Image image) {
        this.image = image;
    }

    public Server getHost() {
        return host;
    }

    public void setHost(Server host) {
        this.host = host;
    }

    public DriverType getDriver() {
        return driver;
    }

    public void setDriver(DriverType driver) {
        this.driver = driver;
    }

    public Integer getCpu() {
        return cpu;
    }

    public void setCpu(Integer cpu) {
        this.cpu = cpu;
    }

    public Integer getRamMb() {
        return ramMb;
    }

    public void setRamMb(Integer ramMb) {
        this.ramMb = ramMb;
    }

    public Integer getDiskGb() {
        return diskGb;
    }

    public void setDiskGb(Integer diskGb) {
        this.diskGb = diskGb;
    }

    public VmStatus getStatus() {
        return status;
    }

    public void setStatus(VmStatus status) {
        this.status = status;
    }

    public String getConsoleToken() {
        return consoleToken;
    }

    public void setConsoleToken(String consoleToken) {
        this.consoleToken = consoleToken;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
