package com.example.demo.Repository;

import com.example.demo.Entity.Slice;
import com.example.demo.Entity.Vlan;
import com.example.demo.Entity.enums.DriverType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VlanRepository extends JpaRepository<Vlan, String> {
    List<Vlan> findBySlice(Slice slice);

    List<Vlan> findByDriver(DriverType driver);

    Optional<Vlan> findByVlanIdAndDriver(Integer vlanId, DriverType driver);
}
