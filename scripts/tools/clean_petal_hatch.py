"""Remove leftover grey checker/hatch backgrounds from petal sprites."""
from collections import deque
from pathlib import Path

from PIL import Image

SPRITES = Path(r"C:\Users\USUARIO\PuzzleBloom\assets\sprites")


def is_bg(r: int, g: int, b: int, a: int) -> bool:
	if a < 10:
		return True
	mx, mn = max(r, g, b), min(r, g, b)
	chroma = mx - mn
	# light grey / checker / leftover key
	if chroma <= 30 and mn >= 130:
		return True
	# mid grey hatch fabric
	if chroma <= 22 and 70 <= mn <= 200:
		return True
	# dark crack scribbles in former transparent areas
	if chroma <= 28 and mx <= 70:
		return True
	return False


def clean(path: Path) -> None:
	im = Image.open(path).convert("RGBA")
	w, h = im.size
	px = im.load()
	visited = [[False] * h for _ in range(w)]
	q: deque[tuple[int, int]] = deque()
	for x in range(w):
		q.append((x, 0))
		q.append((x, h - 1))
	for y in range(h):
		q.append((0, y))
		q.append((w - 1, y))
	while q:
		x, y = q.popleft()
		if x < 0 or y < 0 or x >= w or y >= h or visited[x][y]:
			continue
		visited[x][y] = True
		r, g, b, a = px[x, y]
		if not is_bg(r, g, b, a):
			continue
		px[x, y] = (r, g, b, 0)
		for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
			if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
				q.append((nx, ny))

	# Kill tiny leftover grey islands mostly surrounded by transparency.
	for x in range(w):
		for y in range(h):
			r, g, b, a = px[x, y]
			if a <= 0 or not is_bg(r, g, b, a):
				continue
			neigh = 0
			bgish = 0
			for nx, ny in (
				(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1),
				(x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1),
			):
				if 0 <= nx < w and 0 <= ny < h:
					neigh += 1
					rr, gg, bb, aa = px[nx, ny]
					if aa < 12 or is_bg(rr, gg, bb, aa):
						bgish += 1
			if neigh and bgish / neigh >= 0.5:
				px[x, y] = (r, g, b, 0)

	im2 = im.copy()
	px2 = im2.load()
	for x in range(1, w - 1):
		for y in range(1, h - 1):
			r, g, b, a = px[x, y]
			if a == 0:
				continue
			tcount = sum(1 for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if px[nx, ny][3] < 12)
			if tcount >= 2 and is_bg(r, g, b, a):
				px2[x, y] = (r, g, b, 0)
			elif tcount >= 3:
				px2[x, y] = (r, g, b, max(0, a - 90))

	im2.save(path)
	grey = opaque = 0
	total = w * h
	for r, g, b, a in im2.getdata():
		if a > 200:
			opaque += 1
			if abs(r - g) < 20 and abs(g - b) < 20 and 120 <= r <= 210:
				grey += 1
	corners = [
		im2.getpixel((2, 2))[3],
		im2.getpixel((w - 3, 2))[3],
		im2.getpixel((2, h - 3))[3],
		im2.getpixel((w - 3, h - 3))[3],
	]
	print(path.name, "opaque", round(opaque / total, 3), "grey", round(grey / total, 3), "corners_a", corners)


def main() -> None:
	for name in [
		"petal-rose.png",
		"petal-aqua.png",
		"petal-sun.png",
		"petal-violet.png",
		"petal-lime.png",
	]:
		clean(SPRITES / name)
	print("DONE")


if __name__ == "__main__":
	main()
