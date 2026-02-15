import os
from PIL import Image

# Config
GIF_PATH = "animation.gif"
OUTPUT_FILE = "frames.h"
WIDTH = 128
HEIGHT = 64

def convert():
    img = Image.open(GIF_PATH)
    frames = []
    
    with open(OUTPUT_FILE, "w") as f:
        f.write("#include <pgmspace.h>\n\n")
        
        for i in range(img.n_frames):
            img.seek(i)
            # Convert to 1-bit monochrome and resize
            frame = img.resize((WIDTH, HEIGHT), Image.LANCZOS).convert("1", dither=Image.FLOYDSTEINBERG)
            data = frame.tobytes()
            
            # Write as C array
            f.write(f"const unsigned char frame_{i}[] PROGMEM = {{\n")
            hex_data = [f"0x{b:02x}" for b in data]
            f.write(", ".join(hex_data))
            f.write("\n};\n\n")
            frames.append(f"frame_{i}")

        # Create an array of pointers to the frames
        f.write("const unsigned char* const all_frames[] PROGMEM = {\n")
        f.write(", ".join(frames))
        f.write("\n};\n")
        f.write(f"const int frame_count = {len(frames)};\n")

    print(f"Done! {len(frames)} frames written to {OUTPUT_FILE}")

if __name__ == "__main__":
    convert()
