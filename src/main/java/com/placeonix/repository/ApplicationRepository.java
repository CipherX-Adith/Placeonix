package com.placeonix.repository;

import com.placeonix.entity.Application;
import com.placeonix.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    boolean existsByStudentIdAndJobId(
            Long studentId,
            Long jobId
    );

    List<Application> findByStatus(
            ApplicationStatus status
    );

    List<Application> findByStudentId(
            Long studentId
    );

    List<Application> findByJobCompanyId(
            Long companyId
    );
}