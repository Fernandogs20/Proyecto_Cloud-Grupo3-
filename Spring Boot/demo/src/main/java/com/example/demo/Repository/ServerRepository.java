package com.example.demo.Repository;

import com.example.demo.Entity.Server;
import com.example.demo.Entity.enums.DriverType;
import com.example.demo.Entity.enums.ServerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServerRepository extends JpaRepository<Server, String> {
    List<Server> findByDriver(DriverType driver);

    List<Server> findByStatus(ServerStatus status);

    List<Server> findByAvailabilityZone(String availabilityZone);

    List<Server> findByDriverAndStatus(DriverType driver, ServerStatus status);
}
