package com.example.demo.Repository;

import com.example.demo.Entity.Slice;
import com.example.demo.Entity.User;
import com.example.demo.Entity.enums.DriverType;
import com.example.demo.Entity.enums.SliceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SliceRepository extends JpaRepository<Slice, String> {
    List<Slice> findByOwner(User owner);

    List<Slice> findByStatus(SliceStatus status);

    List<Slice> findByDriver(DriverType driver);

    List<Slice> findByOwnerAndStatus(User owner, SliceStatus status);
}
