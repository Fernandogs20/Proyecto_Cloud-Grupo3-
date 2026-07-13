package com.example.demo.Repository;

import com.example.demo.Entity.Server;
import com.example.demo.Entity.Slice;
import com.example.demo.Entity.VirtualMachine;
import com.example.demo.Entity.enums.VmStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VirtualMachineRepository extends JpaRepository<VirtualMachine, String> {
    List<VirtualMachine> findBySlice(Slice slice);

    List<VirtualMachine> findByHost(Server host);

    List<VirtualMachine> findByStatus(VmStatus status);
}
