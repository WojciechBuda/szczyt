#!/usr/bin/env python3
"""Generates the mountain artwork used by the shop (hero, banners, blog covers, product fallbacks).

The images are procedurally drawn (layered ridgelines, atmospheric haze, snow caps, grain),
so they are original, license-free and served from the site itself — no external hosts.
Replace them with real photos from the admin panel whenever you have them.

Usage:  pip install pillow numpy && python tools/generate_images.py
Output: frontend/shop-web/public/img/
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "frontend" / "shop-web" / "public" / "img"


def ridge(rng, w, roughness, base, amp, octaves=7):
    """1-D fractal ridgeline in [0, 1] (0 = top), length w."""
    y = np.zeros(w)
    for o in range(octaves):
        n = 2 + 2 ** (o + 1)
        pts = rng.random(n)
        x = np.linspace(0, n - 1, w)
        y += np.interp(x, np.arange(n), pts) * (roughness ** o)
    y = (y - y.min()) / (y.max() - y.min() + 1e-9)
    return base - y * amp  # larger value = lower on screen


def lerp(a, b, t):
    return a + (b - a) * t


def hexc(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=float)


PALETTES = {
    # sky_top, sky_bottom, sun, far, near, snow, haze
    "dawn":   ("#27406b", "#f2a974", "#ffd9a0", "#6d7fa6", "#1f2f3f", "#fbe8e0", "#f5c9a3"),
    "alpine": ("#2b6cb0", "#bfe0f2", "#fff6d6", "#7fa0c4", "#27493d", "#ffffff", "#dcecf5"),
    "winter": ("#3a4f78", "#c9d7ee", "#f4f1ff", "#8da2c4", "#34425e", "#ffffff", "#d7e0f0"),
    "forest": ("#3f7f86", "#cfe6d3", "#fff3c4", "#6f9a88", "#1f4332", "#eef6ee", "#cde3d3"),
    "dusk":   ("#1d2144", "#e58a6a", "#ffc58a", "#5b5a8c", "#171a33", "#f1d6e0", "#e8a98b"),
    "night":  ("#070b1f", "#2b3a67", "#dfe6ff", "#34406e", "#0b1022", "#cbd5f5", "#3a4a80"),
}


def render(w, h, palette, seed, peaks=4, sun=(0.72, 0.3), stars=False, horizon=0.62):
    rng = np.random.default_rng(seed)
    sky_top, sky_bot, sun_c, far, near, snow, haze = (hexc(c) for c in PALETTES[palette])
    yy = np.linspace(0, 1, h)[:, None, None]
    img = lerp(sky_top, sky_bot, yy ** 0.9) * np.ones((h, w, 3))

    X, Y = np.meshgrid(np.linspace(0, 1, w), np.linspace(0, 1, h))
    # sun glow
    d = np.sqrt(((X - sun[0]) * w / h) ** 2 + (Y - sun[1]) ** 2)
    glow = np.exp(-(d / 0.22) ** 2)[..., None]
    img = img + glow * (sun_c - img) * 0.55
    disc = (d < 0.035)[..., None]
    img = np.where(disc, sun_c, img)

    if stars:
        mask = rng.random((h, w)) > 0.9985
        star = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        s = np.asarray(star)[..., None] / 255.0 * 3
        img = img + np.clip(s, 0, 1) * (hexc("#ffffff") - img) * (1 - Y[..., None]) * 0.9

    rows = np.arange(h)[:, None]
    for i in range(peaks):
        t = i / max(peaks - 1, 1)            # 0 = farthest, 1 = nearest
        base = (horizon - 0.18 + t * 0.34) * h
        amp = (0.34 - t * 0.12) * h
        line = ridge(rng, w, 0.58 - 0.06 * t, base, amp)
        line = np.maximum(line, h * 0.12)
        mask = rows >= line[None, :]
        col = lerp(far, near, t ** 1.2)
        col = lerp(col, haze, (1 - t) * 0.55)
        depth = np.clip((rows - line[None, :]) / (h * 0.28), 0, 1)[..., None]
        layer = lerp(col * 1.08, col * 0.78, depth)  # darker toward the bottom
        # snow caps on the higher ridges
        if t < 0.75:
            top = line[None, :] + (rng.random(w) * 0.04 * h)[None, :]
            cap_depth = (0.07 + 0.05 * (1 - t)) * h
            noise = ridge(rng, w, 0.7, 0, 1.0, 5)[None, :] * 0.4 * h * 0.05
            snow_mask = (rows >= line[None, :]) & (rows < line[None, :] + cap_depth + noise * 20)
            # only the upper part of tall peaks keeps snow
            tall = (line < (base - amp * 0.45))[None, :]
            snow_mask &= tall
            lit = np.clip(1 - (rows - line[None, :]) / (cap_depth + 1), 0, 1)[..., None]
            layer = np.where(snow_mask[..., None], lerp(layer, snow, 0.55 + 0.4 * lit), layer)
        img = np.where(mask[..., None], layer, img)
        # mist between layers
        mist = np.exp(-((rows - base) / (h * 0.16)) ** 2)[..., None] * 0.25 * (1 - t * 0.6)
        img = img + mist * (haze - img)

    # vignette + grain for a photographic feel
    vig = 1 - 0.22 * (((X - 0.5) ** 2 + (Y - 0.5) ** 2) * 1.6)[..., None]
    img = img * vig
    img = img + rng.normal(0, 3.2, img.shape)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    return im.filter(ImageFilter.GaussianBlur(0.35))


def save(name, size, **kw):
    OUT.mkdir(parents=True, exist_ok=True)
    w, h = size
    render(w, h, **kw).save(OUT / name, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"{name:28s} {w}x{h}")


if __name__ == "__main__":
    # Wide hero / banners (cropped with object-fit: cover, so keep subject low and centered)
    save("hero.jpg", (1600, 700), palette="dawn", seed=11, peaks=5, sun=(0.7, 0.34))
    save("banner-winter.jpg", (1200, 400), palette="winter", seed=23, peaks=4, sun=(0.25, 0.3))
    save("banner-blog.jpg", (1200, 400), palette="forest", seed=31, peaks=4, sun=(0.8, 0.28))

    # Blog covers, 2:1
    save("blog-boots.jpg", (1200, 600), palette="forest", seed=41, peaks=4)
    save("blog-backpack.jpg", (1200, 600), palette="alpine", seed=42, peaks=5)
    save("blog-layers.jpg", (1200, 600), palette="winter", seed=43, peaks=4)
    save("blog-care.jpg", (1200, 600), palette="dusk", seed=44, peaks=5)

    # Product fallbacks, 4:3 (cards crop to 4:3, details page shows them at up to 1000 px wide)
    save("product-clothing.jpg", (1000, 750), palette="alpine", seed=51, peaks=4, sun=(0.3, 0.3))
    save("product-climbing.jpg", (1000, 750), palette="dusk", seed=52, peaks=5, sun=(0.75, 0.38))
    save("product-backpacks.jpg", (1000, 750), palette="forest", seed=53, peaks=4, sun=(0.5, 0.28))
    save("product-boots.jpg", (1000, 750), palette="dawn", seed=54, peaks=4, sun=(0.25, 0.36))
    save("product-default.jpg", (1000, 750), palette="night", seed=55, peaks=4, stars=True, sun=(0.7, 0.25))
