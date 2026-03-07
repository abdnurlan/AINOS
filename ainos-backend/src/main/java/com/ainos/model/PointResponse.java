package com.ainos.model;

public record PointResponse(
    double azimuth,
    double altitude,
    double servoPan,
    double servoTilt
) {}
