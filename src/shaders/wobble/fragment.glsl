varying float vWobble;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

uniform float uChromaticAberration;
uniform vec2 uResolution;

float bayerDither2x2(vec2 position) {
    int x = int(mod(position.x, 2.0));
    int y = int(mod(position.y, 2.0));
    int index = x + y * 2;
    float dither[4];
    dither[0] = 0.0;
    dither[1] = 0.5;
    dither[2] = 0.75;
    dither[3] = 0.25;
    return dither[index];
}

void main() {
    // Ultra-smooth color interpolation
    float wobbleIntensity = vWobble * vWobble * (3.0 - 2.0 * vWobble) * 0.35;

    // Advanced surface tension
    float surfaceTension = wobbleIntensity * wobbleIntensity * (3.0 - 2.0 * wobbleIntensity);

    // Premium steel tints
    vec3 baseTint = vec3(0.85, 0.85, 0.84);
    vec3 peakTint = vec3(0.92, 0.94, 0.96);
    vec3 valleyTint = vec3(0.76, 0.76, 0.75);

    // Quad-interpolation for zero banding
    vec3 lowMid = mix(valleyTint, baseTint, surfaceTension);
    vec3 highMid = mix(baseTint, peakTint, surfaceTension);
    vec3 finalTint = mix(lowMid, highMid, wobbleIntensity);
    
    // ============================================
    // CHROMATIC ABERRATION
    // ============================================
    vec2 screenPos = gl_FragCoord.xy / uResolution;
    vec2 centerVec = screenPos - vec2(0.5);
    float centerDist = length(centerVec);
    
    // Calculate aberration offset based on distance from center
    float aberrationStrength = centerDist * uChromaticAberration;
    
    // Apply different offsets for RGB channels
    vec3 chromaticTint = finalTint;
    chromaticTint.r *= 1.0 + aberrationStrength * 1.5;
    chromaticTint.g *= 1.0 + aberrationStrength * 0.5;
    chromaticTint.b *= 1.0 - aberrationStrength * 0.5;
    
    // Mix based on fresnel for more realistic effect
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 worldNormal = normalize(vWorldNormal);
    float fresnel = 1.0 - max(0.0, dot(viewDirection, worldNormal));
    
    finalTint = mix(finalTint, chromaticTint, fresnel * 0.5);
    
    csm_DiffuseColor.rgb *= finalTint;
    
    // ============================================
    // FRESNEL RIM LIGHTING
    // ============================================
    float rimPower = 2.5;
    float rimIntensity = pow(fresnel, rimPower);
    
    // Dynamic rim color based on wobble
    vec3 rimColorBase = vec3(0.7, 0.85, 1.0);
    vec3 rimColorPeak = vec3(1.0, 0.95, 0.8);
    vec3 rimColor = mix(rimColorBase, rimColorPeak, wobbleIntensity);
    
    // Apply chromatic aberration to rim as well
    rimColor.r *= 1.0 + aberrationStrength * 2.0;
    rimColor.b *= 1.0 - aberrationStrength * 1.0;
    
    // Apply rim lighting
    float rimStrength = 0.4 + wobbleIntensity * 0.3;
    csm_DiffuseColor.rgb += rimColor * rimIntensity * rimStrength;
    
    // Add subtle inner glow
    float innerGlow = pow(1.0 - fresnel, 3.0) * 0.15;
    csm_DiffuseColor.rgb += vec3(0.8, 0.9, 1.0) * innerGlow * wobbleIntensity;
    
    // ============================================
    // MATERIAL PROPERTIES
    // ============================================
    float roughnessCurve = wobbleIntensity * wobbleIntensity;
    float fresnelRoughness = mix(0.28, 0.05, roughnessCurve);
    csm_Roughness = mix(fresnelRoughness, 0.02, rimIntensity * 0.3);
    
    csm_Metalness = mix(0.96, 1.0, wobbleIntensity * 0.25);
    csm_Metalness = mix(csm_Metalness, 1.0, rimIntensity * 0.2);

    // High-quality dithering
    vec2 ditherPos = gl_FragCoord.xy;
    float dither = bayerDither2x2(ditherPos) / 255.0;
    float blueNoise = fract(sin(dot(ditherPos, vec2(12.9898, 78.233))) * 43758.5453);
    
    float finalDither = mix(dither, blueNoise, 0.5) - 0.5;
    csm_DiffuseColor.rgb += finalDither * 0.004;
    
    // Micro-normal perturbation
    float microDetail = fract(sin(dot(ditherPos * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
    csm_Roughness += (microDetail - 0.5) * 0.02;
}