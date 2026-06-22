package com.example.demo.Entity;

import com.example.demo.Entity.enums.DriverType;
import com.example.demo.Entity.enums.ServerStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "servers")
public class Server {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "hostname", nullable = false, length = 150)
    private String hostname;

    @Column(name = "ip_mgmt", nullable = false, length = 45)
    private String ipMgmt;

    @Enumerated(EnumType.STRING)
    @Column(name = "driver", nullable = false)
    private DriverType driver;

    @Column(name = "availability_zone", length = 100)
    private String availabilityZone;

    @Column(name = "total_cpu", nullable = false)
    private Integer totalCpu;

    @Column(name = "total_ram", nullable = false)
    private Integer totalRam;

    @Column(name = "total_disk", nullable = false)
    private Integer totalDisk;

    @Column(name = "used_cpu", nullable = false)
    private Integer usedCpu = 0;

    @Column(name = "used_ram", nullable = false)
    private Integer usedRam = 0;

    @Column(name = "used_disk", nullable = false)
    private Integer usedDisk = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ServerStatus status;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

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

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public String getIpMgmt() {
        return ipMgmt;
    }

    public void setIpMgmt(String ipMgmt) {
        this.ipMgmt = ipMgmt;
    }

    public DriverType getDriver() {
        return driver;
    }

    public void setDriver(DriverType driver) {
        this.driver = driver;
    }

    public String getAvailabilityZone() {
        return availabilityZone;
    }

    public void setAvailabilityZone(String availabilityZone) {
        this.availabilityZone = availabilityZone;
    }

    public Integer getTotalCpu() {
        return totalCpu;
    }

    public void setTotalCpu(Integer totalCpu) {
        this.totalCpu = totalCpu;
    }

    public Integer getTotalRam() {
        return totalRam;
    }

    public void setTotalRam(Integer totalRam) {
        this.totalRam = totalRam;
    }

    public Integer getTotalDisk() {
        return totalDisk;
    }

    public void setTotalDisk(Integer totalDisk) {
        this.totalDisk = totalDisk;
    }

    public Integer getUsedCpu() {
        return usedCpu;
    }

    public void setUsedCpu(Integer usedCpu) {
        this.usedCpu = usedCpu;
    }

    public Integer getUsedRam() {
        return usedRam;
    }

    public void setUsedRam(Integer usedRam) {
        this.usedRam = usedRam;
    }

    public Integer getUsedDisk() {
        return usedDisk;
    }

    public void setUsedDisk(Integer usedDisk) {
        this.usedDisk = usedDisk;
    }

    public ServerStatus getStatus() {
        return status;
    }

    public void setStatus(ServerStatus status) {
        this.status = status;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
