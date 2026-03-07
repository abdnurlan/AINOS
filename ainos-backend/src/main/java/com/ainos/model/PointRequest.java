package com.ainos.model;

public record PointRequest(
    double ra,
    double dec,
    double latitude,
    double longitude,
    double elevation
) {}
