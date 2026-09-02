package com.placeonix.controller;

import com.placeonix.entity.PlacementDrive;
import com.placeonix.service.PlacementDriveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drives")
public class PlacementDriveController {

    @Autowired
    private PlacementDriveService placementDriveService;

    @PostMapping
    public PlacementDrive addDrive(
            @RequestBody PlacementDrive drive) {

        return placementDriveService.addDrive(drive);
    }

    @GetMapping
    public List<PlacementDrive> getAllDrives() {

        return placementDriveService.getAllDrives();
    }

    @GetMapping("/{id}")
    public PlacementDrive getDriveById(
            @PathVariable Long id) {

        return placementDriveService.getDriveById(id);
    }

    @GetMapping("/company/{companyId}")
    public List<PlacementDrive> getDrivesByCompany(
            @PathVariable Long companyId) {

        return placementDriveService
                .getDrivesByCompany(companyId);
    }

    @PutMapping("/{id}")
    public PlacementDrive updateDrive(
            @PathVariable Long id,
            @RequestBody PlacementDrive drive) {

        return placementDriveService
                .updateDrive(id, drive);
    }

    @DeleteMapping("/{id}")
    public String deleteDrive(
            @PathVariable Long id) {

        return placementDriveService
                .deleteDrive(id);
    }
}