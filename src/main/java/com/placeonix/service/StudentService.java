package com.placeonix.service;

import com.placeonix.entity.Student;
import com.placeonix.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public Student addStudent(Student student) {
        return studentRepository.save(student);
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {

        return studentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Student Not Found"));
    }

    public Student updateStudent(Long id, Student updatedStudent) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Student Not Found"));

        student.setName(updatedStudent.getName());
        student.setEmail(updatedStudent.getEmail());
        student.setPhone(updatedStudent.getPhone());
        student.setDepartment(updatedStudent.getDepartment());
        student.setCgpa(updatedStudent.getCgpa());
        student.setSkills(updatedStudent.getSkills());
        student.setResumeUrl(updatedStudent.getResumeUrl());
        student.setGraduationYear(updatedStudent.getGraduationYear());

        return studentRepository.save(student);
    }

    public String deleteStudent(Long id) {

        studentRepository.deleteById(id);

        return "Student Deleted Successfully";
    }
}