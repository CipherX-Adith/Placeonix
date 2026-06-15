package com.placeonix.service;

import com.placeonix.enums.Role;
import com.placeonix.entity.Student;
import com.placeonix.entity.User;
import com.placeonix.repository.StudentRepository;
import com.placeonix.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Student addStudent(Student student) {

        if (userRepository.existsByEmail(student.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Student savedStudent =
                studentRepository.save(student);

        User user = new User();

        user.setUsername(student.getName());
        user.setEmail(student.getEmail());
        user.setPassword(
                passwordEncoder.encode(
                        student.getPassword()
                )
        );
        user.setRole(Role.STUDENT);

        userRepository.save(user);

        return savedStudent;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentById(Long id) {

        return studentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Student Not Found"));
    }

    public Student updateStudent(
            Long id,
            Student updatedStudent) {

        Student student =
                studentRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Student Not Found"));

        student.setName(updatedStudent.getName());
        student.setEmail(updatedStudent.getEmail());
        student.setPhone(updatedStudent.getPhone());
        student.setDepartment(updatedStudent.getDepartment());
        student.setCgpa(updatedStudent.getCgpa());
        student.setSkills(updatedStudent.getSkills());
        student.setResumeUrl(updatedStudent.getResumeUrl());
        student.setGraduationYear(
                updatedStudent.getGraduationYear());

        return studentRepository.save(student);
    }

    public String deleteStudent(Long id) {

        studentRepository.deleteById(id);

        return "Student Deleted Successfully";
    }
}