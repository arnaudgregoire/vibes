vUv = vec2 (repeat, repeat) * uv;
vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
gl_Position = projectionMatrix * mvPosition;