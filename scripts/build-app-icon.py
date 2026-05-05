#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ICONSET = ASSETS / "AppIcon.iconset"
SOURCE_PNG = ASSETS / "app_icon.png"
ICNS = ASSETS / "AppIcon.icns"


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def load_art(name: str, width: int) -> Image.Image:
    image = Image.open(ASSETS / name).convert("RGBA")
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    ratio = width / image.width
    height = round(image.height * ratio)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
        "/System/Library/Fonts/Supplemental/Trebuchet MS Bold.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def make_icon() -> Image.Image:
    size = 1024
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = rounded_mask(size, 220)
    background = Image.new("RGBA", (size, size), "#2d7dd2")
    draw = ImageDraw.Draw(background)

    for y in range(size):
        mix = y / size
        r = round(45 * (1 - mix) + 10 * mix)
        g = round(125 * (1 - mix) + 147 * mix)
        b = round(210 * (1 - mix) + 150 * mix)
        draw.line((0, y, size, y), fill=(r, g, b, 255))

    draw.rounded_rectangle((92, 150, 932, 840), radius=90, fill=(255, 255, 255, 238))
    draw.rounded_rectangle((148, 230, 876, 796), radius=42, outline="#c9d3e5", width=18)

    cell_w = 104
    cell_h = 82
    x0 = 174
    y0 = 312
    colors = ["#2d7dd2", "#ffb703", "#0a9396", "#f45d48", "#6a4c93"]
    for row in range(4):
      for col in range(6):
        x = x0 + col * (cell_w + 11)
        y = y0 + row * (cell_h + 14)
        fill = "#f6f8fc" if (row + col) % 2 else "#eaf4ff"
        draw.rounded_rectangle((x, y, x + cell_w, y + cell_h), radius=18, fill=fill)
    for index, color in enumerate(colors):
        x = x0 + (index % 5) * (cell_w + 11)
        y = y0 + 28 + (index // 5) * 96
        draw.rounded_rectangle((x + 13, y, x + cell_w - 12, y + 24), radius=12, fill=color)

    rocket = load_art("cartoon_rocket.png", 305)
    robot = load_art("cartoon_robot.png", 330)
    badge = load_art("reward_badge.png", 178)
    background.alpha_composite(robot, (92, 664 - robot.height // 2))
    background.alpha_composite(rocket, (655, 104))
    background.alpha_composite(badge, (696, 684))

    draw = ImageDraw.Draw(background)
    draw.rounded_rectangle((174, 196, 606, 282), radius=38, fill="#25324b")
    draw.text((218, 215), "KIDS", fill="#ffffff", font=font(48))
    draw.text((374, 215), "2026", fill="#ffb703", font=font(48))

    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((22, 28, 1002, 1008), radius=230, fill=(37, 50, 75, 95))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    icon.alpha_composite(shadow, (0, 0))
    clipped = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    clipped.alpha_composite(background, (0, 0))
    clipped.putalpha(mask)
    icon.alpha_composite(clipped, (0, 0))
    return icon


def write_iconset(source: Image.Image) -> None:
    ICONSET.mkdir(exist_ok=True)
    specs = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }
    for filename, size in specs.items():
        source.resize((size, size), Image.Resampling.LANCZOS).save(ICONSET / filename)


def write_icns(source: Image.Image) -> None:
    specs = [
        ("icp4", 16),
        ("icp5", 32),
        ("icp6", 64),
        ("ic07", 128),
        ("ic08", 256),
        ("ic09", 512),
        ("ic10", 1024),
    ]
    chunks = []
    for code, size in specs:
        png_path = ICONSET / f"icon_{size}x{size}.png"
        if size == 64:
            png_path = ICONSET / "icon_32x32@2x.png"
        elif size == 1024:
            png_path = ICONSET / "icon_512x512@2x.png"
        data = png_path.read_bytes()
        chunks.append(code.encode("ascii") + (len(data) + 8).to_bytes(4, "big") + data)
    payload = b"".join(chunks)
    ICNS.write_bytes(b"icns" + (len(payload) + 8).to_bytes(4, "big") + payload)


def main() -> None:
    icon = make_icon()
    icon.save(SOURCE_PNG)
    write_iconset(icon)
    write_icns(icon)
    print(f"Created {SOURCE_PNG}")
    print(f"Created {ICNS}")


if __name__ == "__main__":
    main()
