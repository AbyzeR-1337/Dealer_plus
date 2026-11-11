"""Generates realistic second-hand listing photos for every catalogue model.

Input: a JSON list from scripts/photo_prompts.mjs ({id, file, variant, seed, prompt}).
Output: assets/photos/<variant>/<file>.jpg (512x512). Already generated files are skipped, so the
run can be stopped and resumed. Needs torch + diffusers (CPU is fine, ~3-4 s per photo on 4 cores with the tiny decoder).

  node scripts/photo_prompts.mjs clean,worn > prompts.json
  python scripts/gen_photos.py prompts.json [--model stabilityai/sd-turbo] [--limit N]
"""
import json, os, sys, time, argparse
import torch
from diffusers import AutoPipelineForText2Image, AutoencoderTiny

ap = argparse.ArgumentParser()
ap.add_argument('prompts')
ap.add_argument('--model', default='stabilityai/sd-turbo')
ap.add_argument('--out', default='assets/photos')
ap.add_argument('--limit', type=int, default=0)
ap.add_argument('--size', type=int, default=512)
ap.add_argument('--full-vae', action='store_true', help='decode with the full VAE (3x slower, nearly identical)')
args = ap.parse_args()

torch.set_num_threads(os.cpu_count() or 4)
items = json.load(open(args.prompts))
todo = [x for x in items if not os.path.exists(os.path.join(args.out, x['variant'], x['file'] + '.jpg'))]
if args.limit: todo = todo[:args.limit]
print(f'{len(todo)} to generate ({len(items) - len(todo)} done)', flush=True)
if not todo: sys.exit(0)
pipe = AutoPipelineForText2Image.from_pretrained(args.model, torch_dtype=torch.float32, safety_checker=None)
if not args.full_vae: pipe.vae = AutoencoderTiny.from_pretrained('madebyollin/taesd', torch_dtype=torch.float32)
pipe.set_progress_bar_config(disable=True)
t0 = time.time()
for n, x in enumerate(todo, 1):
    d = os.path.join(args.out, x['variant'])
    os.makedirs(d, exist_ok=True)
    img = pipe(prompt=x['prompt'], num_inference_steps=1, guidance_scale=0.0, width=args.size, height=args.size,
               generator=torch.Generator().manual_seed(int(x['seed']))).images[0]
    tmp = os.path.join(d, x['file'] + '.tmp.jpg')
    img.save(tmp, quality=80, optimize=True, progressive=True)
    os.replace(tmp, os.path.join(d, x['file'] + '.jpg'))
    if n % 10 == 0 or n == len(todo):
        el = time.time() - t0
        print(f'{n}/{len(todo)} {el / n:.1f}s/img eta {(len(todo) - n) * el / n / 60:.0f} min', flush=True)
