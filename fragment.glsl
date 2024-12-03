varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
uniform vec4 uResolution;

void main() {
    vec2 newUv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
    newUv = vUv;
    vec4 color = texture2D(uTexture, newUv);
    vec4 offset = texture2D(uDataTexture, newUv);
    gl_FragColor = vec4(1, 0.5, 1, 1.);
    gl_FragColor = color;
    gl_FragColor = texture2D(uDataTexture, newUv);
    gl_FragColor = texture2D(uTexture, newUv - 0.02*offset.xy);
}