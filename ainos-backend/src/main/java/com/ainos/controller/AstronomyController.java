package com.ainos.controller;

import com.ainos.model.PlanetPosition;
import com.ainos.model.PointRequest;
import com.ainos.model.PointResponse;
import com.ainos.model.SelectedObject;
import com.ainos.service.AstronomyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AstronomyController {

    private final AstronomyService astronomyService;

    // Current laser state
    private Map<String, Object> laserState = new HashMap<>();

    public AstronomyController(AstronomyService astronomyService) {
        this.astronomyService = astronomyService;
        laserState.put("active", false);
    }

    @GetMapping("/planets")
    public List<PlanetPosition> getPlanets(
            @RequestParam(defaultValue = "40.4093") double latitude,
            @RequestParam(defaultValue = "49.8671") double longitude,
            @RequestParam(defaultValue = "28") double elevation) {
        return astronomyService.calculatePlanetPositions(latitude, longitude, elevation);
    }

    @GetMapping("/selected-object")
    public ResponseEntity<SelectedObject> getSelectedObject() {
        return ResponseEntity.ok(new SelectedObject(
                (boolean) laserState.getOrDefault("active", false),
                (Double) laserState.getOrDefault("azimuth", null),
                (Double) laserState.getOrDefault("altitude", null)));
    }

    @PostMapping("/point")
    public PointResponse pointTo(@RequestBody PointRequest request) {
        return astronomyService.calculatePointingAngles(request);
    }

    @PostMapping("/stop")
    public void stopTracking() {
        // Phase 2: Stop tracking loop
    }

    /**
     * Point laser at celestial coordinates.
     * 
     * Request body:
     * {
     * "ra": 83.633, // Right Ascension in degrees (0-360)
     * "dec": 22.014, // Declination in degrees (-90 to +90)
     * "objectName": "M1", // Optional: name of target object
     * "objectType": "dso" // Optional: type (star, planet, dso, etc.)
     * }
     */
    // Default observer location — used only as fallback
    private static final double DEFAULT_OBSERVER_LAT = 46.2044; // Geneva
    private static final double DEFAULT_OBSERVER_LON = 6.1432;

    @PostMapping("/laser/point")
    public Map<String, Object> pointLaser(@RequestBody Map<String, Object> command) {
        Double ra = ((Number) command.get("ra")).doubleValue();
        Double dec = ((Number) command.get("dec")).doubleValue();
        String objectName = (String) command.getOrDefault("objectName", "Unknown");
        String objectType = (String) command.getOrDefault("objectType", "unknown");

        // Use frontend-provided observer location if available
        double observerLat = command.containsKey("observerLat")
                ? ((Number) command.get("observerLat")).doubleValue()
                : DEFAULT_OBSERVER_LAT;
        double observerLon = command.containsKey("observerLon")
                ? ((Number) command.get("observerLon")).doubleValue()
                : DEFAULT_OBSERVER_LON;

        // ============================================================
        // STEP 1: Get Alt/Az — prefer frontend-calculated values
        // Frontend has the exact observer position + simulation time
        // ============================================================
        double altitude;
        double azimuth;

        if (command.containsKey("altitude") && command.containsKey("azimuth")
                && command.get("altitude") != null && command.get("azimuth") != null) {
            // Use frontend-calculated coordinates (most accurate)
            altitude = ((Number) command.get("altitude")).doubleValue();
            azimuth = ((Number) command.get("azimuth")).doubleValue();
        } else {
            // Fallback: calculate from RA/Dec using observer location
            double[] altAz = equatorialToHorizontal(ra, dec, observerLat, observerLon);
            altitude = altAz[0];
            azimuth = altAz[1];
        }

        // ============================================================
        // STEP 2: Convert Alt/Az → Servo motor angles
        // Azimuth → horizontal servo (pan)
        // Altitude → vertical servo (tilt)
        // ============================================================
        double servoAzimuth = azimuthToServoAngle(azimuth); // 0-180 for servo
        double servoAltitude = altitudeToServoAngle(altitude); // 0-180 for servo

        // ============================================================
        // STEP 3: Send to hardware (serial/GPIO/MQTT)
        // TODO: Replace with real hardware communication
        // ============================================================
        sendToHardware(servoAzimuth, servoAltitude, altitude > 0);

        // Log everything
        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║       LASER POINT COMMAND            ║");
        System.out.println("╠══════════════════════════════════════╣");
        System.out.println("║ Target:    " + objectName);
        System.out.println("║ Type:      " + objectType);
        System.out.println("║ RA:        " + String.format("%.4f", ra) + "°");
        System.out.println("║ Dec:       " + String.format("%.4f", dec) + "°");
        System.out.println("║ Altitude:  " + String.format("%.2f", altitude) + "°");
        System.out.println("║ Azimuth:   " + String.format("%.2f", azimuth) + "°");
        System.out.println("║ Servo Pan: " + String.format("%.1f", servoAzimuth) + "°");
        System.out.println("║ Servo Tlt: " + String.format("%.1f", servoAltitude) + "°");
        System.out.println("║ Above Hz:  " + (altitude > 0 ? "YES ✓" : "NO ✗"));
        System.out.println("╚══════════════════════════════════════╝");

        // Update state
        laserState.put("active", true);
        laserState.put("targetRa", ra);
        laserState.put("targetDec", dec);
        laserState.put("altitude", Math.round(altitude * 100.0) / 100.0);
        laserState.put("azimuth", Math.round(azimuth * 100.0) / 100.0);
        laserState.put("servoAzimuth", Math.round(servoAzimuth * 10.0) / 10.0);
        laserState.put("servoAltitude", Math.round(servoAltitude * 10.0) / 10.0);
        laserState.put("aboveHorizon", altitude > 0);
        laserState.put("objectName", objectName);
        laserState.put("objectType", objectType);
        laserState.put("timestamp", Instant.now().toString());

        return laserState;
    }

    /**
     * Convert equatorial coordinates (RA/Dec) to horizontal (Alt/Az).
     * Uses current time and observer location.
     * 
     * @param raDeg  Right Ascension in degrees (0-360)
     * @param decDeg Declination in degrees (-90 to +90)
     * @param latDeg Observer latitude in degrees
     * @param lonDeg Observer longitude in degrees
     * @return [altitude, azimuth] in degrees
     */
    private double[] equatorialToHorizontal(double raDeg, double decDeg, double latDeg, double lonDeg) {
        // Current time
        double jd = getJulianDate();

        // Greenwich Mean Sidereal Time (hours)
        double T = (jd - 2451545.0) / 36525.0;
        double gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
                + 0.000387933 * T * T - T * T * T / 38710000.0;
        gmst = ((gmst % 360) + 360) % 360; // normalize to 0-360

        // Local Sidereal Time (degrees)
        double lst = gmst + lonDeg;
        lst = ((lst % 360) + 360) % 360;

        // Hour Angle (degrees)
        double ha = lst - raDeg;
        ha = ((ha % 360) + 360) % 360;

        // Convert to radians
        double haRad = Math.toRadians(ha);
        double decRad = Math.toRadians(decDeg);
        double latRad = Math.toRadians(latDeg);

        // Calculate altitude
        double sinAlt = Math.sin(decRad) * Math.sin(latRad)
                + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
        double altitude = Math.toDegrees(Math.asin(sinAlt));

        // Calculate azimuth
        double cosAz = (Math.sin(decRad) - Math.sin(Math.toRadians(altitude)) * Math.sin(latRad))
                / (Math.cos(Math.toRadians(altitude)) * Math.cos(latRad));
        cosAz = Math.max(-1, Math.min(1, cosAz)); // clamp
        double azimuth = Math.toDegrees(Math.acos(cosAz));

        if (Math.sin(haRad) > 0) {
            azimuth = 360 - azimuth;
        }

        return new double[] { altitude, azimuth };
    }

    /**
     * Get current Julian Date.
     */
    private double getJulianDate() {
        long millis = System.currentTimeMillis();
        return (millis / 86400000.0) + 2440587.5;
    }

    /**
     * Convert azimuth (0-360°) to servo angle (0-180°).
     * Maps the visible hemisphere to servo range.
     * 
     * TODO: Calibrate based on your actual servo mount orientation.
     * Current mapping: Azimuth 0-360 → Servo 0-180 (wraps at 180)
     */
    private double azimuthToServoAngle(double azimuth) {
        // Simple linear mapping: 0-360 → 0-180
        // You may need to adjust based on hardware mount direction
        double servo = (azimuth / 360.0) * 180.0;
        return Math.max(0, Math.min(180, servo));
    }

    /**
     * Convert altitude (0-90°) to servo angle (0-180°).
     * Horizon (0°) → servo 90°, Zenith (90°) → servo 0°
     * 
     * TODO: Calibrate based on your actual servo mount.
     */
    private double altitudeToServoAngle(double altitude) {
        if (altitude < 0)
            return 90; // below horizon, point at horizon
        // Map: 0° alt → 90° servo (horizontal), 90° alt → 0° servo (straight up)
        double servo = 90 - altitude;
        return Math.max(0, Math.min(180, servo));
    }

    /**
     * Send servo angles to hardware.
     * 
     * TODO: Implement actual hardware communication:
     * - Serial (USB/UART) to Arduino/ESP32
     * - GPIO on Raspberry Pi
     * - MQTT to IoT device
     * - WebSocket to ESP32
     * 
     * Example serial command format: "AZ:120.5,ALT:45.0,LASER:ON\n"
     */
    private void sendToHardware(double servoAz, double servoAlt, boolean laserOn) {
        // Format command string for hardware
        String hardwareCommand = String.format("AZ:%.1f,ALT:%.1f,LASER:%s",
                servoAz, servoAlt, laserOn ? "ON" : "OFF");

        System.out.println(">>> HARDWARE CMD: " + hardwareCommand);

        // ========================================
        // TODO: Replace this with real hardware I/O
        // ========================================
        // Option 1: Serial port (Arduino/ESP32)
        // serialPort.write(hardwareCommand + "\n");
        //
        // Option 2: GPIO (Raspberry Pi)
        // pwmController.setAngle(PAN_PIN, servoAz);
        // pwmController.setAngle(TILT_PIN, servoAlt);
        //
        // Option 3: MQTT
        // mqttClient.publish("ainos/laser/command", hardwareCommand);
        //
        // Option 4: HTTP to ESP32
        // httpClient.post("http://192.168.1.100/servo", hardwareCommand);
    }

    /**
     * Turn off laser.
     */
    @PostMapping("/laser/off")
    public Map<String, Object> turnOffLaser() {
        System.out.println("=== LASER OFF COMMAND ===");

        laserState.put("active", false);
        laserState.put("targetRa", null);
        laserState.put("targetDec", null);
        laserState.put("objectName", null);
        laserState.put("timestamp", Instant.now().toString());

        return laserState;
    }

    /**
     * Get current laser status.
     */
    @GetMapping("/laser/status")
    public Map<String, Object> getLaserStatus() {
        return laserState;
    }
}
