from PIL import Image
from pathlib import Path

src = Path(r"C:\Users\USUARIO\PuzzleBloom\assets\_import")
out_sprites = Path(r"C:\Users\USUARIO\PuzzleBloom\assets\sprites")
out_bg = Path(r"C:\Users\USUARIO\PuzzleBloom\assets\bg")
out_sprites.mkdir(parents=True, exist_ok=True)
out_bg.mkdir(parents=True, exist_ok=True)


def knock_white(img: Image.Image, thresh: int = 242, soft: int = 22) -> Image.Image:
	img = img.convert("RGBA")
	px = img.load()
	w, h = img.size
	for y in range(h):
		for x in range(w):
			r, g, b, a = px[x, y]
			m = min(r, g, b)
			if m >= thresh:
				px[x, y] = (r, g, b, 0)
			elif m >= thresh - soft:
				alpha = int(255 * (thresh - m) / soft)
				px[x, y] = (r, g, b, alpha)
	return img


for name in [
	"petal-rose",
	"petal-aqua",
	"petal-sun",
	"petal-violet",
	"petal-lime",
	"face-happy",
	"face-sparkle",
	"face-hit",
]:
	im = Image.open(src / f"{name}.jpg")
	im = knock_white(im)
	bbox = im.getbbox()
	if bbox:
		im = im.crop(bbox)
	s = max(im.size) + 8
	canvas = Image.new("RGBA", (s, s), (0, 0, 0, 0))
	canvas.paste(im, ((s - im.size[0]) // 2, (s - im.size[1]) // 2), im)
	canvas = canvas.resize((256, 256), Image.Resampling.LANCZOS)
	canvas.save(out_sprites / f"{name}.png")
	print("wrote", name, canvas.size)

bg = Image.open(src / "bg-garden.jpg").convert("RGB")
bg = bg.resize((720, 1280), Image.Resampling.LANCZOS)
bg.save(out_bg / "bg-garden.png", optimize=True)
print("bg", bg.size)
print("DONE")
