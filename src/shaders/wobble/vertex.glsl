uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;
uniform float uWarpPositionFrequency;
uniform float uWarpTimeFrequency;
uniform float uWarpStrength;
uniform float uNormalShift;
uniform float uSmoothingFactor;
uniform vec2 uMouseInfluence;

attribute vec4 tangent;

varying float vWobble;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

#include ../includes/simplexNoise4d.glsl

float hermite(float t) {
    return t * t * (3.0 - 2.0 * t);
}

float quintic(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

vec3 getWobble(vec3 position) {
    vec3 warpedPosition = position;

    // Initial warp
    warpedPosition += simplexNoise4d(vec4(
        position * uWarpPositionFrequency,
        uTime * uWarpTimeFrequency
    )) * uWarpStrength;
    
    // Simple mouse influence
    warpedPosition.x += uMouseInfluence.x * 2.0;
    warpedPosition.y += uMouseInfluence.y * 2.0;

    // Traveling waves
    vec3 travelingPosition = warpedPosition + vec3(
        uTime * 0.1,
        uTime * 0.08,
        uTime * 0.06
    );

    // Base noise
    float noiseX = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency,
        uTime * uTimeFrequency
    ));

    float noiseY = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency + 200.0,
        uTime * uTimeFrequency + 200.0
    ));

    float noiseZ = simplexNoise4d(vec4(
        travelingPosition * uPositionFrequency + 400.0,
        uTime * uTimeFrequency + 400.0
    ));

    // Opposite flow
    vec3 oppositeTravel = warpedPosition - vec3(
        uTime * 0.08,
        uTime * 0.05,
        uTime * 0.07
    );

    float flowX = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5,
        uTime * uTimeFrequency * 0.8
    )) * 0.8;

    float flowY = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5 + 300.0,
        uTime * uTimeFrequency * 0.8 + 300.0
    )) * 0.8;

    float flowZ = simplexNoise4d(vec4(
        oppositeTravel * uPositionFrequency * 0.5 + 400.0,
        uTime * uTimeFrequency * 0.8 + 400.0
    )) * 0.8;

    // Detail layer
    float detailX = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0,
        uTime * uTimeFrequency * 1.5
    )) * 0.3;

    float detailY = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0 + 300.0,
        uTime * uTimeFrequency * 1.5 + 300.0
    )) * 0.3;

    float detailZ = simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency * 2.0 + 400.0,
        uTime * uTimeFrequency * 1.5 + 400.0
    )) * 0.3;

    // Combine with adaptive smoothing
    float combinedX = noiseX + detailX + flowX;
    float combinedY = noiseY + detailY + flowY;
    float combinedZ = noiseZ + detailZ + flowZ;
    
    // Apply hermite smoothing
    combinedX = mix(combinedX, hermite((combinedX + 1.0) * 0.5) * 2.0 - 1.0, uSmoothingFactor);
    combinedY = mix(combinedY, hermite((combinedY + 1.0) * 0.5) * 2.0 - 1.0, uSmoothingFactor);
    combinedZ = mix(combinedZ, hermite((combinedZ + 1.0) * 0.5) * 2.0 - 1.0, uSmoothingFactor);

    return vec3(combinedX, combinedY, combinedZ) * uStrength;
}

void main() {
    vec3 biTangent = cross(normal, tangent.xyz);

    float shift = uNormalShift;
    vec3 positionA = csm_Position + tangent.xyz * shift;
    vec3 positionB = csm_Position + biTangent.xyz * shift;

    // Get wobble
    vec3 wobble3D = getWobble(csm_Position);

    // Apply displacement
    csm_Position += wobble3D.x * normal * 1.0;
    csm_Position += wobble3D.y * tangent.xyz * 1.0;
    csm_Position += wobble3D.z * biTangent * 1.0;
    
    // Neighbor positions
    vec3 wobbleA = getWobble(positionA);
    positionA += wobbleA.x * normal;
    positionA += wobbleA.y * tangent.xyz;
    positionA += wobbleA.z * biTangent;
    
    vec3 wobbleB = getWobble(positionB);
    positionB += wobbleB.x * normal;
    positionB += wobbleB.y * tangent.xyz;
    positionB += wobbleB.z * biTangent;

    // Compute smooth normals
    vec3 toA = normalize(positionA - csm_Position);
    vec3 toB = normalize(positionB - csm_Position);
    csm_Normal = normalize(cross(toA, toB));

    // Adaptive wobble value
    float wobbleStrength = length(wobble3D) / uStrength;
    vWobble = quintic(clamp(wobbleStrength, 0.0, 1.0));
    
    // Pass world space normal and position for Fresnel
    vWorldNormal = normalize(mat3(modelMatrix) * csm_Normal);
    vWorldPosition = (modelMatrix * vec4(csm_Position, 1.0)).xyz;
}