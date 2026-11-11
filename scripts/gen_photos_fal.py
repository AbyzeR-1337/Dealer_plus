"""Generates realistic second-hand listing photos for catalogue models with FLUX on fal.ai.

Input: JSON from `node scripts/photo_prompts.mjs clean,worn,broken` ({id, file, variant, seed, prompt}).
Output: assets/photos/<variant>/<file>.webp (512 px). Existing files are skipped, so runs can resume.
The fal.ai key is sent as `Authorization: Key <FAL_KEY>` (env FAL_KEY; in the cloud session a proxy adds it).

  node scripts/photo_prompts.mjs clean,worn,broken > prompts.json
  python3 scripts/gen_photos_fal.py prompts.json [--model fal-ai/flux/schnell] [--limit N] [--jobs 6]
"""
import argparse, io, json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('prompts')
ap.add_argument('--model', default='fal-ai/flux/schnell')
ap.add_argument('--out', default='assets/photos')
ap.add_argument('--limit', type=int, default=0)
ap.add_argument('--jobs', type=int, default=6)
ap.add_argument('--size', type=int, default=512)
ap.add_argument('--gen', type=int, default=768, help='generated image size before downscaling')
args = ap.parse_args()
KEY = os.environ.get('FAL_KEY', 'proxy-injected')

def call(prompt, seed):
    body = json.dumps({'prompt': prompt, 'image_size': {'width': args.gen, 'height': args.gen}, 'num_images': 1, 'seed': seed, 'enable_safety_checker': False}).encode()
    for k in range(5):
        try:
            req = urllib.request.Request(f'https://fal.run/{args.model}', data=body, headers={'Content-Type': 'application/json', 'Authorization': f'Key {KEY}'})
            with urllib.request.urlopen(req, timeout=180) as r: res = json.load(r)
            url = res['images'][0]['url']
            with urllib.request.urlopen(url, timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (401, 403) and b'balance' in msg.lower(): raise SystemExit('fal.ai: balance exhausted — top up and run again')
            if e.code in (429, 500, 502, 503, 504): time.sleep(4 * (k + 1)); continue
            raise RuntimeError(f'{e.code} {msg}')
        except (TimeoutError, OSError):
            time.sleep(4 * (k + 1))
    raise RuntimeError('gave up')

def work(x):
    d = os.path.join(args.out, x['variant'])
    os.makedirs(d, exist_ok=True)
    raw = call(x['prompt'], int(x['seed']) % 2147483647)
    im = Image.open(io.BytesIO(raw)).convert('RGB').resize((args.size, args.size), Image.LANCZOS)
    tmp = os.path.join(d, x['file'] + '.tmp.webp')
    im.save(tmp, 'WEBP', quality=80, method=5)
    os.replace(tmp, os.path.join(d, x['file'] + '.webp'))
    return x['file']

items = json.load(open(args.prompts))
todo = [x for x in items if not os.path.exists(os.path.join(args.out, x['variant'], x['file'] + '.webp'))]
if args.limit: todo = todo[:args.limit]
print(f'{len(todo)} to generate ({len(items) - len(todo)} done)', flush=True)
t0 = time.time(); n = 0; fails = 0
with ThreadPoolExecutor(args.jobs) as ex:
    futs = [ex.submit(work, x) for x in todo]
    for f in as_completed(futs):
        try: f.result(); n += 1
        except SystemExit as e: print(e, flush=True); ex.shutdown(cancel_futures=True); sys.exit(2)
        except Exception as e: fails += 1; print('fail', e, flush=True)
        if (n + fails) % 25 == 0: print(f'{n + fails}/{len(todo)} ok {n} fail {fails} · {(time.time() - t0) / max(1, n):.2f}s/img', flush=True)
print(f'done {n}, failed {fails}', flush=True)
