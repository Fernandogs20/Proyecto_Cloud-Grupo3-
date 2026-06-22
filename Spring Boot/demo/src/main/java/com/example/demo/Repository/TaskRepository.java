package com.example.demo.Repository;

import com.example.demo.Entity.Slice;
import com.example.demo.Entity.Task;
import com.example.demo.Entity.User;
import com.example.demo.Entity.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {
    List<Task> findBySlice(Slice slice);

    List<Task> findByUser(User user);

    List<Task> findByStatusOrderByPriorityDescCreatedAtAsc(TaskStatus status);
}
