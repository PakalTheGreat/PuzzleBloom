shader_type canvas_item;

uniform vec4 base_color : source_color = vec4(1.0, 0.42, 0.62, 1.0);
uniform vec4 deep_color : source_color = vec4(0.55, 0.15, 0.32, 1.0);
uniform vec4 glow_color : source_color = vec4(1.0, 0.75, 0.85, 1.0);
uniform float bevel : hint_range(0.0, 1.0) = 0.72;
uniform float specular : hint_range(0.0, 1.0) = 0.55;
uniform float glow_strength : hint_range(0.0, 2.0) = 0.0;
uniform float damage_flash : hint_range(0.0, 1.0) = 0.0;
uniform float time_offset = 0.0;
uniform int shape_mode = 0; // 0 common round, 1 durable hex, 2 aoe star-round

float sd_round_box(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + r;
	return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float sd_hex(vec2 p, float r) {
	const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
	p = abs(p);
	p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
	p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
	return length(p) * sign(p.y);
}

float sd_starish(vec2 p, float r) {
	float a = atan(p.y, p.x);
	float soft = 0.88 + 0.12 * cos(a * 5.0);
	return length(p) - r * soft;
}

void fragment() {
	vec2 uv = UV * 2.0 - 1.0;
	float d;
	if (shape_mode == 1) {
		d = sd_hex(uv, 0.78);
	} else if (shape_mode == 2) {
		d = sd_starish(uv, 0.82);
	} else {
		d = sd_round_box(uv, vec2(0.72), 0.42);
	}

	float aa = fwidth(d) * 1.5;
	float mask = 1.0 - smoothstep(0.0, aa, d);
	if (mask <= 0.001) {
		discard;
	}

	// Soft volume: top-left light, bottom-right depth
	float light = clamp(0.55 - uv.x * 0.35 - uv.y * 0.45, 0.0, 1.0);
	float shade = clamp(0.35 + uv.x * 0.25 + uv.y * 0.4, 0.0, 1.0);
	vec3 col = mix(deep_color.rgb, base_color.rgb, bevel);
	col = mix(col, base_color.rgb * 1.15, light * 0.65);
	col = mix(col, deep_color.rgb * 0.75, shade * 0.45);

	// Specular lobe
	vec2 spec_pos = uv - vec2(-0.28, -0.34);
	float spec = exp(-dot(spec_pos, spec_pos) * 18.0) * specular;
	col += vec3(1.0) * spec * 0.85;

	// Inner rim
	float rim = smoothstep(0.08, 0.0, abs(d + 0.06));
	col = mix(col, glow_color.rgb, rim * 0.25);

	// AoE / special pulse glow
	float pulse = 0.5 + 0.5 * sin(TIME * 3.2 + time_offset);
	col += glow_color.rgb * glow_strength * (0.35 + 0.35 * pulse);

	// Hit flash
	col = mix(col, vec3(1.0), damage_flash);

	// Contact shadow under edge
	float shadow = smoothstep(0.15, -0.05, d) * (1.0 - mask);
	col *= 1.0 - shadow * 0.0;

	COLOR = vec4(col, mask);
}
