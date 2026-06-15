package com.placeonix.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "placement_drives")
public class PlacementDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String driveName;

    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    private LocalDate driveDate;

    private String venue;

    @Column(length = 1000)
    private String description;

    private Double eligibilityCgpa;

    private String status;

    public PlacementDrive() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDriveName() {
        return driveName;
    }

    public void setDriveName(String driveName) {
        this.driveName = driveName;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public LocalDate getDriveDate() {
        return driveDate;
    }

    public void setDriveDate(LocalDate driveDate) {
        this.driveDate = driveDate;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getEligibilityCgpa() {
        return eligibilityCgpa;
    }

    public void setEligibilityCgpa(Double eligibilityCgpa) {
        this.eligibilityCgpa = eligibilityCgpa;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}