package com.ainos.service;

import com.ainos.model.PlanetPosition;
import com.ainos.model.PointRequest;
import com.ainos.model.PointResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Astronomy service implementing coordinate conversions and planet position calculations
 * using standard astronomical algorithms (Meeus "Astronomical Algorithms").
 */
@Service
public class AstronomyService {

    /**
     * Calculate positions for all planets, Moon, and Sun.
     * Uses simplified orbital elements for planet positions.
     */
    public List<PlanetPosition> calculatePlanetPositions(double latitude, double longitude, double elevation) {
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        double jd = toJulianDate(now);
        double lst = localSiderealTime(jd, longitude);

        List<PlanetPosition> positions = new ArrayList<>();

        // Sun
        double[] sunPos = calculateSunPosition(jd);
        addPosition(positions, "Sun", sunPos[0], sunPos[1], latitude, lst, -26.74, 1.0);

        // Moon (simplified)
        double[] moonPos = calculateMoonPosition(jd);
        addPosition(positions, "Moon", moonPos[0], moonPos[1], latitude, lst, -12.7, 0.00257);

        // Planets using simplified orbital elements
        String[] planetNames = {"Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"};
        double[][] orbitalElements = getPlanetaryElements(jd);

        for (int i = 0; i < planetNames.length; i++) {
            double[] pos = calculatePlanetRA_Dec(orbitalElements[i], sunPos, jd);
            double mag = estimatePlanetMagnitude(planetNames[i]);
            double dist = orbitalElements[i][5]; // semi-major axis as rough distance
            addPosition(positions, planetNames[i], pos[0], pos[1], latitude, lst, mag, dist);
        }

        return positions;
    }

    /**
     * Convert RA/Dec to Azimuth/Altitude and compute servo angles.
     */
    public PointResponse calculatePointingAngles(PointRequest request) {
        ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
        double jd = toJulianDate(now);
        double lst = localSiderealTime(jd, request.longitude());

        double[] horizontal = equatorialToHorizontal(
            request.ra(), request.dec(), request.latitude(), lst
        );

        double azimuth = horizontal[0];
        double altitude = horizontal[1];

        // Map to servo angles
        double servoPan = mapServoAngle(azimuth, 0, 360, 0, 180);
        double servoTilt = mapServoAngle(Math.max(0, altitude), 0, 90, 0, 90);

        return new PointResponse(
            round2(azimuth), round2(altitude), round2(servoPan), round2(servoTilt)
        );
    }

    // ========= Core Astronomical Algorithms =========

    /**
     * Convert equatorial (RA/Dec in degrees) to horizontal (Az/Alt) coordinates.
     */
    private double[] equatorialToHorizontal(double raDeg, double decDeg, double latDeg, double lstHours) {
        double ha = (lstHours * 15.0 - raDeg + 360) % 360; // Hour angle in degrees
        double haRad = Math.toRadians(ha);
        double decRad = Math.toRadians(decDeg);
        double latRad = Math.toRadians(latDeg);

        // Altitude
        double sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                         Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
        double altitude = Math.toDegrees(Math.asin(sinAlt));

        // Azimuth
        double cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
                        (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
        cosAz = Math.max(-1, Math.min(1, cosAz)); // Clamp
        double azimuth = Math.toDegrees(Math.acos(cosAz));
        if (Math.sin(haRad) > 0) {
            azimuth = 360 - azimuth;
        }

        return new double[]{azimuth, altitude};
    }

    /**
     * Calculate Julian Date from ZonedDateTime.
     */
    private double toJulianDate(ZonedDateTime dt) {
        int y = dt.getYear();
        int m = dt.getMonthValue();
        double d = dt.getDayOfMonth() + dt.getHour() / 24.0 + dt.getMinute() / 1440.0 + dt.getSecond() / 86400.0;

        if (m <= 2) { y -= 1; m += 12; }
        int A = y / 100;
        int B = 2 - A + A / 4;

        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
    }

    /**
     * Calculate Local Sidereal Time in hours.
     */
    private double localSiderealTime(double jd, double longitude) {
        double T = (jd - 2451545.0) / 36525.0;
        double gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                     0.000387933 * T * T - T * T * T / 38710000.0;
        gst = ((gst % 360) + 360) % 360;
        double lst = gst + longitude;
        lst = ((lst % 360) + 360) % 360;
        return lst / 15.0; // Convert to hours
    }

    /**
     * Calculate Sun's RA and Dec (simplified).
     */
    private double[] calculateSunPosition(double jd) {
        double T = (jd - 2451545.0) / 36525.0;

        // Mean longitude and anomaly
        double L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
        double M = Math.toRadians((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360);

        // Equation of center
        double C = (1.914602 - 0.004817 * T) * Math.sin(M) +
                   (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
                   0.000289 * Math.sin(3 * M);

        double sunLon = Math.toRadians(L0 + C);

        // Obliquity of ecliptic
        double epsilon = Math.toRadians(23.439291 - 0.0130042 * T);

        // RA and Dec
        double ra = Math.toDegrees(Math.atan2(Math.cos(epsilon) * Math.sin(sunLon), Math.cos(sunLon)));
        ra = (ra + 360) % 360;
        double dec = Math.toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(sunLon)));

        return new double[]{ra, dec};
    }

    /**
     * Calculate Moon's RA and Dec (simplified).
     */
    private double[] calculateMoonPosition(double jd) {
        double T = (jd - 2451545.0) / 36525.0;

        double L = Math.toRadians((218.3165 + 481267.8813 * T) % 360);
        double M = Math.toRadians((134.9634 + 477198.8676 * T) % 360);
        double F = Math.toRadians((93.2721 + 483202.0175 * T) % 360);

        double lon = L + Math.toRadians(6.2888) * Math.sin(M)
                       + Math.toRadians(1.274) * Math.sin(2 * L - M)
                       + Math.toRadians(0.6583) * Math.sin(2 * L);
        double lat = Math.toRadians(5.128) * Math.sin(F);

        double epsilon = Math.toRadians(23.439291 - 0.0130042 * T);

        double ra = Math.toDegrees(Math.atan2(
            Math.sin(lon) * Math.cos(epsilon) - Math.tan(lat) * Math.sin(epsilon),
            Math.cos(lon)
        ));
        ra = (ra + 360) % 360;

        double dec = Math.toDegrees(Math.asin(
            Math.sin(lat) * Math.cos(epsilon) + Math.cos(lat) * Math.sin(epsilon) * Math.sin(lon)
        ));

        return new double[]{ra, dec};
    }

    /**
     * Simplified planetary orbital elements for the current epoch.
     * Returns [L, a, e, i, omega, w] for each planet.
     */
    private double[][] getPlanetaryElements(double jd) {
        double T = (jd - 2451545.0) / 36525.0;

        return new double[][] {
            // Mercury
            {(252.2509 + 149472.6747 * T) % 360, 0.387098, 0.205635, 7.0050, 48.331, 77.456},
            // Venus
            {(181.9798 + 58517.8157 * T) % 360, 0.723332, 0.006773, 3.3947, 76.680, 131.564},
            // Mars
            {(355.4530 + 19140.2993 * T) % 360, 1.523679, 0.093394, 1.8497, 49.559, 336.060},
            // Jupiter
            {(34.3515 + 3034.9057 * T) % 360, 5.202660, 0.048498, 1.3033, 100.464, 14.331},
            // Saturn
            {(50.0774 + 1222.1138 * T) % 360, 9.554909, 0.055509, 2.4886, 113.666, 93.057},
            // Uranus
            {(314.0550 + 428.4677 * T) % 360, 19.21845, 0.046296, 0.7734, 74.006, 173.005},
            // Neptune
            {(304.3487 + 218.4862 * T) % 360, 30.11039, 0.009456, 1.7700, 131.784, 48.124},
        };
    }

    /**
     * Calculate planet RA/Dec from orbital elements (simplified).
     */
    private double[] calculatePlanetRA_Dec(double[] elements, double[] sunPos, double jd) {
        double L = elements[0];
        double a = elements[1];
        double e = elements[2];

        // Mean anomaly → Eccentric anomaly (Kepler's equation, 1 iteration)
        double M = Math.toRadians(L);
        double E = M + e * Math.sin(M) * (1 + e * Math.cos(M));

        // Heliocentric coordinates
        double xh = a * (Math.cos(E) - e);
        double yh = a * Math.sqrt(1 - e * e) * Math.sin(E);

        // Ecliptic longitude
        double lonH = Math.toDegrees(Math.atan2(yh, xh));
        lonH = (lonH + 360) % 360;

        // Simplified: ecliptic to equatorial using Sun's position as reference
        double epsilon = Math.toRadians(23.439);
        double lonRad = Math.toRadians(lonH);

        double ra = Math.toDegrees(Math.atan2(
            Math.cos(epsilon) * Math.sin(lonRad), Math.cos(lonRad)
        ));
        ra = (ra + 360) % 360;

        double dec = Math.toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(lonRad)));

        return new double[]{ra, dec};
    }

    private double estimatePlanetMagnitude(String name) {
        return switch (name) {
            case "Mercury" -> -0.4;
            case "Venus" -> -4.4;
            case "Mars" -> -2.0;
            case "Jupiter" -> -2.7;
            case "Saturn" -> 0.5;
            case "Uranus" -> 5.7;
            case "Neptune" -> 7.8;
            default -> 0.0;
        };
    }

    private void addPosition(List<PlanetPosition> positions, String name,
                              double ra, double dec, double lat, double lst,
                              double magnitude, double distance) {
        double[] hz = equatorialToHorizontal(ra, dec, lat, lst);
        positions.add(new PlanetPosition(name, round2(ra), round2(dec),
            round2(hz[0]), round2(hz[1]), magnitude, round2(distance)));
    }

    private double mapServoAngle(double value, double inMin, double inMax, double outMin, double outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
