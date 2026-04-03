from __future__ import annotations

from PIL import Image, ImageDraw, ImageFont


def draw_centered_name(
    image: Image.Image,
    name: str,
    font: ImageFont.ImageFont,
    color: tuple[int, int, int],
    x: int | None,
    y: int | None,
    zone_top_ratio: float,
    zone_bottom_ratio: float,
    zone_padding: int,
) -> None:
    draw = ImageDraw.Draw(image)
    left, top, right, bottom = draw.textbbox((0, 0), name, font=font)
    text_width = int(right - left)
    text_height = int(bottom - top)

    text_x = x if x is not None else (image.width - text_width) // 2

    if y is not None:
        text_y = y
    else:
        zone_top = int(image.height * zone_top_ratio) + zone_padding
        zone_bottom = int(image.height * zone_bottom_ratio) - zone_padding

        if zone_bottom <= zone_top:
            text_y = (image.height - text_height) // 2
        else:
            target_y = zone_top + ((zone_bottom - zone_top - text_height) // 2)
            min_y = int(max(zone_top, 0))
            max_y = int(max(min_y, zone_bottom - text_height))
            text_y = int(min(max(target_y, min_y), max_y))

    draw.text((text_x, text_y), name, fill=color, font=font)

