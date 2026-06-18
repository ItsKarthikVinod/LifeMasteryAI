#!/usr/bin/env python3
"""
LifeMastery PWA Icon Generator
Generates all required icon sizes from a source image for PWA manifest
"""

import os
import sys
from PIL import Image
import argparse

# All required icon sizes for PWA
ICON_SIZES = {
    "android-chrome-96x96.png": 96,
    "android-chrome-128x128.png": 128,
    "android-chrome-144x144.png": 144,
    "android-chrome-152x152.png": 152,
    "android-chrome-168x168.png": 168,
    "android-chrome-180x180.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
    "android-chrome-maskable-192x192.png": 192,
    "android-chrome-maskable-512x512.png": 512,
}

# Shortcut icons for app shortcuts
SHORTCUT_ICON_SIZES = {
    "shortcut-journal-96x96.png": 96,
    "shortcut-todo-96x96.png": 96,
    "shortcut-dashboard-96x96.png": 96,
}

def apply_maskable_background(image, size):
    """
    Apply a solid background color to make a maskable icon
    Maskable icons should have the main content centered with safe zone
    """
    # Create new image with background
    background = Image.new("RGBA", (size, size), (46, 58, 89, 255))  # #2e3a59
    
    # Calculate position to center the image
    img_size = int(size * 0.8)  # Use 80% of the space for safe zone
    resized = image.resize((img_size, img_size), Image.Resampling.LANCZOS)
    
    offset = (size - img_size) // 2
    background.paste(resized, (offset, offset), resized)
    
    return background


def generate_icon(source_path, output_dir, size, filename, is_maskable=False):
    """Generate a single icon from source image"""
    try:
        # Open source image
        img = Image.open(source_path)
        
        # Convert to RGBA
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        # Apply maskable background if needed
        if is_maskable:
            img = apply_maskable_background(img, size)
        else:
            # Just resize for regular icons
            img.thumbnail((size, size), Image.Resampling.LANCZOS)
            
            # Create new image with padding (for non-square sources)
            square_img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
            offset = ((size - img.width) // 2, (size - img.height) // 2)
            square_img.paste(img, offset, img)
            img = square_img
        
        # Save icon
        output_path = os.path.join(output_dir, filename)
        img.save(output_path, "PNG", quality=95)
        print(f"✓ Generated: {filename} ({size}x{size})")
        
        return True
    except Exception as e:
        print(f"✗ Error generating {filename}: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Generate all PWA icon sizes from a source image"
    )
    parser.add_argument(
        "source",
        help="Path to source image (should be at least 512x512px)",
    )
    parser.add_argument(
        "-o", "--output",
        default="public",
        help="Output directory (default: public)",
    )
    parser.add_argument(
        "--shortcuts-only",
        action="store_true",
        help="Only generate shortcut icons",
    )
    
    args = parser.parse_args()
    
    # Validate source file
    if not os.path.exists(args.source):
        print(f"Error: Source file not found: {args.source}")
        sys.exit(1)
    
    # Create output directory if needed
    os.makedirs(args.output, exist_ok=True)
    
    # Generate icons
    print(f"Generating icons from: {args.source}")
    print(f"Output directory: {args.output}")
    print()
    
    success_count = 0
    total_count = 0
    
    # Generate main app icons
    if not args.shortcuts_only:
        print("📱 Generating app icons:")
        print("-" * 40)
        
        for filename, size in ICON_SIZES.items():
            total_count += 1
            is_maskable = "maskable" in filename
            if generate_icon(args.source, args.output, size, filename, is_maskable):
                success_count += 1
        
        print()
    
    # Generate shortcut icons
    print("⚡ Generating shortcut icons:")
    print("-" * 40)
    
    for filename, size in SHORTCUT_ICON_SIZES.items():
        total_count += 1
        if generate_icon(args.source, args.output, size, filename):
            success_count += 1
    
    print()
    print("=" * 40)
    print(f"✅ Complete! Generated {success_count}/{total_count} icons")
    
    if success_count == total_count:
        print("\n📋 Next steps:")
        print("1. Verify icons in the 'public' directory")
        print("2. Run: npm run build")
        print("3. Deploy to production")
        print("4. Test on mobile: DevTools > Application > Manifest")
    
    sys.exit(0 if success_count == total_count else 1)


if __name__ == "__main__":
    main()
