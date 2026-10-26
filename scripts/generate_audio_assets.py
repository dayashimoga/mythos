"""
Script to synthesize procedural WAV audio assets for Mythos 3D presentation:
- UI clicks, opens, closes
- Quest updates and checkpoint chimes
- Seven-realm atmospheric soundscapes
Zero-dependency, using Python standard library (wave, struct, math, random).
"""

import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100

def write_wav(filepath: str, samples: list[float], sample_rate: int = SAMPLE_RATE, channels: int = 1):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, "w") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)
        
        raw_data = bytearray()
        for s in samples:
            val = max(-1.0, min(1.0, s))
            int_val = int(val * 32767.0)
            raw_data.extend(struct.pack("<h", int_val))
            if channels == 2:
                raw_data.extend(struct.pack("<h", int_val))
                
        wav_file.writeframes(raw_data)
    print(f"[Audio Generator] Generated: {filepath} ({len(samples)} samples, {len(samples)/sample_rate:.2f}s)")

def gen_ui_click() -> list[float]:
    duration = 0.05
    n = int(SAMPLE_RATE * duration)
    samples = []
    freq = 1200.0
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 90.0)
        s = math.sin(2.0 * math.pi * freq * t) * env * 0.4
        samples.append(s)
    return samples

def gen_ui_open() -> list[float]:
    duration = 0.18
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 1.5
        # Upward chord: 440Hz -> 660Hz -> 880Hz
        freq = 440.0 + (t / duration) * 440.0
        s = (math.sin(2.0 * math.pi * freq * t) * 0.5 + 
             math.sin(2.0 * math.pi * freq * 1.5 * t) * 0.3) * env * 0.35
        samples.append(s)
    return samples

def gen_ui_close() -> list[float]:
    duration = 0.15
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        env = (1.0 - (t / duration)) ** 1.8
        # Downward chord: 660Hz -> 330Hz
        freq = 660.0 - (t / duration) * 330.0
        s = (math.sin(2.0 * math.pi * freq * t) * 0.6) * env * 0.3
        samples.append(s)
    return samples

def gen_checkpoint_chime() -> list[float]:
    duration = 1.2
    n = int(SAMPLE_RATE * duration)
    samples = []
    # Golden resonance chime: 528Hz (Solfeggio harmonic) + 1056Hz
    for i in range(n):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 3.5)
        s1 = math.sin(2.0 * math.pi * 528.0 * t) * 0.45
        s2 = math.sin(2.0 * math.pi * 1056.0 * t) * 0.25
        s3 = math.sin(2.0 * math.pi * 1584.0 * t) * 0.12
        samples.append((s1 + s2 + s3) * env * 0.6)
    return samples

def gen_quest_complete() -> list[float]:
    duration = 2.0
    n = int(SAMPLE_RATE * duration)
    samples = []
    # Sacred fanfare intervals (Root -> 4th -> 5th -> Octave)
    notes = [
        (0.0, 0.4, 440.0),   # A4
        (0.35, 0.4, 554.37), # C#5
        (0.7, 0.4, 659.25),  # E5
        (1.05, 0.95, 880.0)  # A5
    ]
    for i in range(n):
        t = i / SAMPLE_RATE
        sample = 0.0
        for start, dur, freq in notes:
            if start <= t < start + dur:
                nt = t - start
                env = math.sin(math.pi * (nt / dur)) ** 1.2 * math.exp(-nt * 1.5)
                sample += (math.sin(2.0 * math.pi * freq * nt) * 0.4 + 
                           math.sin(2.0 * math.pi * freq * 2.0 * nt) * 0.2) * env
        samples.append(sample * 0.5)
    return samples

def gen_ambient_drone(base_freq: float, texture_type: str, duration: float = 4.0) -> list[float]:
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Loopable window envelope
        loop_env = math.sin(math.pi * (t / duration)) ** 0.5
        
        # Base Tanpura / Drone harmonics
        d1 = math.sin(2.0 * math.pi * base_freq * t) * 0.35
        d2 = math.sin(2.0 * math.pi * (base_freq * 1.5) * t) * 0.25
        d3 = math.sin(2.0 * math.pi * (base_freq * 2.0) * t) * 0.15
        
        # Texture overlay
        tex = 0.0
        if texture_type == "wind":
            # White-ish filtered noise for wind
            noise = (random.random() * 2.0 - 1.0) * 0.12
            sway = math.sin(2.0 * math.pi * 0.4 * t) * 0.5 + 0.5
            tex = noise * sway
        elif texture_type == "cavern":
            # Sub-bass rumble
            tex = math.sin(2.0 * math.pi * 28.0 * t) * 0.2
        elif texture_type == "solar":
            # Shimmering high harmonics
            tex = math.sin(2.0 * math.pi * (base_freq * 4.0) * t + math.sin(t * 8.0)) * 0.15
        elif texture_type == "astral":
            # Ethereal fifths
            tex = math.sin(2.0 * math.pi * (base_freq * 3.0) * t) * 0.18
        elif texture_type == "forge":
            # Low pulse
            pulse = math.sin(2.0 * math.pi * 1.2 * t) ** 4
            tex = math.sin(2.0 * math.pi * 45.0 * t) * pulse * 0.25
        elif texture_type == "moksha":
            # Concentric celestial octave rings
            tex = (math.sin(2.0 * math.pi * (base_freq * 0.5) * t) * 0.2 +
                   math.sin(2.0 * math.pi * (base_freq * 2.5) * t) * 0.12)

        s = (d1 + d2 + d3 + tex) * loop_env * 0.45
        samples.append(s)
    return samples

def main():
    base_dir = "godot/assets/audio/sfx"
    
    # 1. UI and Gameplay Sound FX
    write_wav(os.path.join(base_dir, "ui_click.wav"), gen_ui_click())
    write_wav(os.path.join(base_dir, "ui_open.wav"), gen_ui_open())
    write_wav(os.path.join(base_dir, "ui_close.wav"), gen_ui_close())
    write_wav(os.path.join(base_dir, "checkpoint_chime.wav"), gen_checkpoint_chime())
    write_wav(os.path.join(base_dir, "quest_complete.wav"), gen_quest_complete())
    
    # 2. Ambient Soundscapes (4-second loopable audio stems)
    amb_dir = "godot/assets/audio/ambience"
    write_wav(os.path.join(amb_dir, "ambient_bhumi.wav"), gen_ambient_drone(110.0, "wind", 4.0))        # A2
    write_wav(os.path.join(amb_dir, "ambient_antariksha.wav"), gen_ambient_drone(146.83, "wind", 4.0)) # D3
    write_wav(os.path.join(amb_dir, "ambient_patala.wav"), gen_ambient_drone(73.42, "cavern", 4.0))    # D2
    write_wav(os.path.join(amb_dir, "ambient_svar.wav"), gen_ambient_drone(164.81, "solar", 4.0))      # E3
    write_wav(os.path.join(amb_dir, "ambient_maharloka.wav"), gen_ambient_drone(130.81, "astral", 4.0)) # C3
    write_wav(os.path.join(amb_dir, "ambient_tapoloka.wav"), gen_ambient_drone(82.41, "forge", 4.0))    # E2
    write_wav(os.path.join(amb_dir, "ambient_satyaloka.wav"), gen_ambient_drone(216.0, "moksha", 4.0))  # A3 (432Hz harmonic)

    print("[Audio Generator] All procedural audio assets generated successfully!")

if __name__ == "__main__":
    main()
