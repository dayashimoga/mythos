"""
Mythos 3D - Production Audio Synthesizer
Stage Q1 Remediation: Generates authentic 16-bit 44.1kHz PCM sound effects for 3D combat,
locomotion, interactables, and atmosphere in Godot 4.3.
"""

import os
import math
import wave
import struct
import numpy as np

SAMPLE_RATE = 44100

def write_wav(path, samples, sample_rate=SAMPLE_RATE):
    # Normalize to -1.0 .. 1.0
    max_val = np.max(np.abs(samples))
    if max_val > 1e-5:
        norm_samples = samples / max_val * 0.92
    else:
        norm_samples = samples

    int_samples = (norm_samples * 32767.0).astype(np.int16)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(int_samples.tobytes())
    print(f"[Audio Synthesizer] Generated {os.path.basename(path)} ({len(int_samples)*2} bytes)")

def synth_sword_slash():
    duration = 0.28
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Pitch bend blade sweep
    freq = 600.0 - 350.0 * (t / duration)
    phase = 2.0 * math.pi * np.cumsum(freq) / SAMPLE_RATE
    tone = np.sin(phase) + 0.5 * np.sin(phase * 2.1) + 0.25 * np.sin(phase * 3.2)
    # Air whoosh noise
    noise = np.random.uniform(-1.0, 1.0, len(t))
    env = np.sin(np.clip(t / duration, 0.0, 1.0) * math.pi) ** 1.8
    return (tone * 0.4 + noise * 0.6) * env

def synth_parry_clink():
    duration = 0.45
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Bell-like golden harmonic clink
    bell = (
        np.sin(2.0 * math.pi * 2800.0 * t) * 0.5 +
        np.sin(2.0 * math.pi * 4200.0 * t) * 0.35 +
        np.sin(2.0 * math.pi * 6400.0 * t) * 0.15
    )
    env = np.exp(-t * 9.5)
    return bell * env

def synth_dash_whoosh():
    duration = 0.35
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Filtered noise sweep
    noise = np.random.uniform(-1.0, 1.0, len(t))
    freq = 1200.0 - 900.0 * (t / duration)
    carrier = np.sin(2.0 * math.pi * np.cumsum(freq) / SAMPLE_RATE)
    env = np.sin(t / duration * math.pi) ** 2.0
    return (noise * 0.7 + carrier * 0.3) * env

def synth_crystal_pickup():
    duration = 0.65
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Ascending celestial arpeggio (C6, E6, G6, B6, C7)
    frequencies = [1046.5, 1318.5, 1567.9, 1975.5, 2093.0]
    result = np.zeros_like(t)
    sub_dur = duration / len(frequencies)
    for i, f in enumerate(frequencies):
        start_idx = int(i * sub_dur * SAMPLE_RATE)
        t_note = t[start_idx:] - i * sub_dur
        if len(t_note) > 0:
            env = np.exp(-t_note * 6.0)
            note = np.sin(2.0 * math.pi * f * t_note) + 0.3 * np.sin(2.0 * math.pi * f * 2.0 * t_note)
            result[start_idx:] += note * env * 0.45
    return result

def synth_boss_roar():
    duration = 1.2
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Low-frequency titan growl with sub-harmonics
    f0 = 65.0 + 20.0 * np.sin(2.0 * math.pi * 3.5 * t)
    phase = 2.0 * math.pi * np.cumsum(f0) / SAMPLE_RATE
    growl = (
        np.sin(phase) * 0.5 +
        np.sin(phase * 1.5) * 0.3 +
        np.sin(phase * 2.5) * 0.2
    )
    noise = np.random.uniform(-0.5, 0.5, len(t))
    env = np.sin(np.clip(t / duration, 0.0, 1.0) * math.pi) ** 1.2
    return (growl + noise * 0.35) * env

def synth_altar_attune():
    duration = 1.5
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Tanpura root-fifth harmonic drone (C3=130.81Hz, G3=196.0Hz)
    drone = (
        np.sin(2.0 * math.pi * 130.81 * t) * 0.4 +
        np.sin(2.0 * math.pi * 196.00 * t) * 0.35 +
        np.sin(2.0 * math.pi * 261.63 * t) * 0.2 +
        np.sin(2.0 * math.pi * 392.00 * t) * 0.15
    )
    env = np.sin(t / duration * math.pi) ** 0.8
    return drone * env

def synth_footstep():
    duration = 0.09
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.uniform(-1.0, 1.0, len(t))
    punch = np.sin(2.0 * math.pi * 120.0 * t)
    env = np.exp(-t * 35.0)
    return (punch * 0.6 + noise * 0.4) * env

def synth_hit_impact():
    duration = 0.22
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    thump = np.sin(2.0 * math.pi * 85.0 * t) * np.exp(-t * 18.0)
    crunch = np.random.uniform(-1.0, 1.0, len(t)) * np.exp(-t * 28.0)
    return thump * 0.7 + crunch * 0.5

def main():
    out_dir = "godot/assets/audio/sfx"
    print("\n=== Generating Mythos 3D Sound Effects Pipeline ===")
    write_wav(os.path.join(out_dir, "sword_slash.wav"), synth_sword_slash())
    write_wav(os.path.join(out_dir, "parry_clink.wav"), synth_parry_clink())
    write_wav(os.path.join(out_dir, "dash_whoosh.wav"), synth_dash_whoosh())
    write_wav(os.path.join(out_dir, "crystal_pickup.wav"), synth_crystal_pickup())
    write_wav(os.path.join(out_dir, "boss_roar.wav"), synth_boss_roar())
    write_wav(os.path.join(out_dir, "altar_attune.wav"), synth_altar_attune())
    write_wav(os.path.join(out_dir, "footstep_stone.wav"), synth_footstep())
    write_wav(os.path.join(out_dir, "hit_impact.wav"), synth_hit_impact())
    print("=== All 3D Audio Sound Effects Generated Cleanly! ===\n")

if __name__ == "__main__":
    main()
