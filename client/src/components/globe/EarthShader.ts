import * as THREE from 'three';

export const EarthShaderMaterial = {
  uniforms: {
    sunDirection: { value: new THREE.Vector3(1.0, 0.4, 0.6).normalize() },
    atmosphereColor: { value: new THREE.Color(0xb45309) }, // Deep warm amber rim glow
    oceanColor: { value: new THREE.Color(0x06070a) },      // Deep space black oceans
    landColor: { value: new THREE.Color(0x18181b) },       // Charcoal land masses
    nightLightsColor: { value: new THREE.Color(0xd97706) } // Deep warm gold city lights
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 sunDirection;
    uniform vec3 atmosphereColor;
    uniform vec3 oceanColor;
    uniform vec3 landColor;
    uniform vec3 nightLightsColor;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    // Fast pseudo Perlin noise for procedural continents
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(sunDirection);
      vec3 viewDir = normalize(-vPosition);

      // Diffuse sunlight
      float NdotL = dot(normal, lightDir);
      float dayFactor = smoothstep(-0.15, 0.25, NdotL);

      // Procedural continents vs oceans
      vec2 sampleUv = vUv * vec2(10.0, 5.0);
      float landMask = step(0.48, fbm(sampleUv));

      // Day colors
      vec3 dayColor = mix(oceanColor, landColor, landMask);

      // Specular ocean glint
      vec3 halfVector = normalize(lightDir + viewDir);
      float NdotH = max(0.0, dot(normal, halfVector));
      float specular = pow(NdotH, 32.0) * (1.0 - landMask) * dayFactor * 0.4;

      // Night city lights on continents
      float cityNoise = fbm(sampleUv * 4.0);
      float cityLights = step(0.65, cityNoise) * landMask * (1.0 - dayFactor);
      vec3 nightColor = nightLightsColor * cityLights * 2.0;

      // Rayleigh Atmosphere rim glow (deep amber / red aura)
      float rim = 1.0 - max(0.0, dot(viewDir, normal));
      vec3 rimGlow = atmosphereColor * pow(rim, 3.2) * (dayFactor * 0.7 + 0.3);

      vec3 finalColor = mix(nightColor, dayColor, dayFactor) + vec3(specular) + rimGlow;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
