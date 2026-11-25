# Contact sheet of extracted frames: python capture/sheet.py out/frames ad out/sheet-ad.png
import sys, glob
from PIL import Image
d, prefix, out = sys.argv[1], sys.argv[2], sys.argv[3]
files = sorted(glob.glob(f"{d}/{prefix}-*.png"))
cols = 10; w = 216; h = 384
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * h), "black")
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((w, h))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out)
print(out, len(files), "frames")
