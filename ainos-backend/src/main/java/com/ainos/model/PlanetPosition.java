package com.ainos.model;

public record PlanetPosition(
    String name,
    double ra,
    double dec,
    double azimuth,
    double altitude,
    double magnitude,
    double distance
) {}
