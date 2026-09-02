package com.placeonix.repository;

import com.placeonix.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository
        extends JpaRepository<Student, Long> {
}

/* this automatically gives this without writing sql
save()
findAll()
findById()
deleteById()
count()
existsById()
*/
