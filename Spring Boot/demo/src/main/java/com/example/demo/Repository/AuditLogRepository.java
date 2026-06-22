package com.example.demo.Repository;

import com.example.demo.Entity.AuditLog;
import com.example.demo.Entity.Slice;
import com.example.demo.Entity.User;
import com.example.demo.Entity.VirtualMachine;
import com.example.demo.Entity.enums.LogLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByLevel(LogLevel level);

    List<AuditLog> findBySlice(Slice slice);

    List<AuditLog> findByVm(VirtualMachine vm);

    List<AuditLog> findByUser(User user);
}
