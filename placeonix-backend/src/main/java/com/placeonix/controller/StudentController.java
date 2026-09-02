package com.placeonix.controller;

import com.placeonix.entity.Student;
import com.placeonix.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @PostMapping
    public Student addStudent(
            @RequestBody Student student) {

        return studentService.addStudent(student);
    }

    @GetMapping
    public List<Student> getAllStudents() {

        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public Student getStudentById(
            @PathVariable Long id) {

        return studentService.getStudentById(id);
    }

    @PutMapping("/{id}")
    public Student updateStudent(
            @PathVariable Long id,
            @RequestBody Student student) {

        return studentService.updateStudent(id, student);
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(
            @PathVariable Long id) {

        return studentService.deleteStudent(id);
    }
}