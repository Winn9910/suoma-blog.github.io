#!/usr/bin/env python3
"""
博客图片转 WebP 工具
用法：
  1. 把新图片放到 source/img/blogimg/ 目录
  2. 运行: python scripts/img2webp.py
  3. 脚本自动转换所有非webp图片，并更新文章中的引用

也可以转换单个文件:
  python scripts/img2webp.py 文件名.jpg
"""
import os
import re
import sys

BLOGIMG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "source", "img", "blogimg")
POSTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "source", "_posts")
CONVERT_EXTS = {".png", ".jpg", ".jpeg", ".gif"}

def convert_image(filepath):
    """Convert a single image to WebP, return (old_name, new_name) or None."""
    from PIL import Image
    
    fname = os.path.basename(filepath)
    ext = os.path.splitext(fname)[1].lower()
    if ext not in CONVERT_EXTS:
        return None
    
    new_name = os.path.splitext(fname)[0] + ".webp"
    new_path = os.path.join(os.path.dirname(filepath), new_name)
    
    if os.path.exists(new_path):
        print(f"  跳过(已存在): {new_name}")
        return None
    
    try:
        img = Image.open(filepath)
        if img.mode in ("P", "LA"):
            img = img.convert("RGBA")
        elif img.mode != "RGB" and img.mode != "RGBA":
            img = img.convert("RGB")
        
        img.save(new_path, "WEBP", quality=85, method=6)
        old_size = os.path.getsize(filepath)
        new_size = os.path.getsize(new_path)
        ratio = (1 - new_size / old_size) * 100
        
        os.remove(filepath)
        print(f"  {fname} -> {new_name}  {old_size//1024}KB -> {new_size//1024}KB  (-{ratio:.0f}%)")
        return (fname, new_name)
    except Exception as e:
        print(f"  失败: {fname} - {e}")
        return None

def update_md_refs(old_name, new_name):
    """Update markdown references for a converted file."""
    count = 0
    for fname in os.listdir(POSTS_DIR):
        if not fname.endswith(".md"):
            continue
        fpath = os.path.join(POSTS_DIR, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        pattern = re.compile(re.escape(old_name), re.IGNORECASE)
        new_content = pattern.sub(new_name, content)
        
        if new_content != content:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(new_content)
            count += 1
    
    return count

def main():
    # Check Pillow
    try:
        from PIL import Image
    except ImportError:
        print("需要安装 Pillow: pip install Pillow")
        sys.exit(1)
    
    converted = []
    
    if len(sys.argv) > 1:
        # Convert specific file(s)
        for arg in sys.argv[1:]:
            filepath = os.path.join(BLOGIMG_DIR, arg) if not os.path.isabs(arg) else arg
            if os.path.exists(filepath):
                result = convert_image(filepath)
                if result:
                    converted.append(result)
            else:
                print(f"  文件不存在: {arg}")
    else:
        # Convert all non-webp images in blogimg/
        for fname in os.listdir(BLOGIMG_DIR):
            ext = os.path.splitext(fname)[1].lower()
            if ext in CONVERT_EXTS:
                result = convert_image(os.path.join(BLOGIMG_DIR, fname))
                if result:
                    converted.append(result)
    
    if not converted:
        print("没有需要转换的图片")
        return
    
    # Update markdown references
    print("\n--- 更新文章引用 ---")
    for old_name, new_name in converted:
        count = update_md_refs(old_name, new_name)
        print(f"  {old_name} -> {new_name}: 更新了 {count} 个文件")
    
    print(f"\n完成! 共转换 {len(converted)} 张图片")

if __name__ == "__main__":
    main()
