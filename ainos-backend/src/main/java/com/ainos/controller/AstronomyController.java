package com.ainos.controller;

import com.ainos.model.PlanetPosition;
import com.ainos.model.PointRequest;
import com.ainos.model.PointResponse;
import com.ainos.service.AstronomyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AstronomyController {

    private final AstronomyService astronomyService;

    public AstronomyController(AstronomyService astronomyService) {
        this.astronomyService = astronomyService;
    }

    @GetMapping("/planets")
    public List<PlanetPosition> getPlanets(
            @RequestParam(defaultValue = "40.4093") double latitude,
            @RequestParam(defaultValue = "49.8671") double longitude,
            @RequestParam(defaultValue = "28") double elevation) {
        return astronomyService.calculatePlanetPositions(latitude, longitude, elevation);
    }

    @PostMapping("/point")
    public PointResponse pointTo(@RequestBody PointRequest request) {
        return astronomyService.calculatePointingAngles(request);
    }

    @PostMapping("/stop")
    public void stopTracking() {
        // Phase 2: Stop tracking loop
    }
}
