package com.placeonix.service;

import com.placeonix.entity.PlacementDrive;
import com.placeonix.repository.PlacementDriveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlacementDriveService {

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    public PlacementDrive addDrive(
            PlacementDrive drive) {

        return placementDriveRepository.save(drive);
    }

    public List<PlacementDrive> getAllDrives() {

        return placementDriveRepository.findAll();
    }

    public PlacementDrive getDriveById(
            Long id) {

        return placementDriveRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Drive Not Found"));
    }

    public List<PlacementDrive> getDrivesByCompany(
            Long companyId) {

        return placementDriveRepository
                .findByCompanyId(companyId);
    }

    public PlacementDrive updateDrive(
            Long id,
            PlacementDrive updatedDrive) {

        PlacementDrive drive =
                placementDriveRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Drive Not Found"));

        drive.setDriveName(
                updatedDrive.getDriveName());

        drive.setCompany(
                updatedDrive.getCompany());

        drive.setDriveDate(
                updatedDrive.getDriveDate());

        drive.setVenue(
                updatedDrive.getVenue());

        drive.setDescription(
                updatedDrive.getDescription());

        drive.setEligibilityCgpa(
                updatedDrive.getEligibilityCgpa());

        drive.setStatus(
                updatedDrive.getStatus());

        return placementDriveRepository.save(drive);
    }

    public String deleteDrive(
            Long id) {

        placementDriveRepository.deleteById(id);

        return "Placement Drive Deleted Successfully";
    }
}