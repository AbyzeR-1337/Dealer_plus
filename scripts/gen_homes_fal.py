"""Interior / exterior photos for real-estate listings (FLUX on fal.ai), 640x480 WebP in assets/homes/.

  python3 scripts/gen_homes_fal.py [--jobs 6] [--force]

Pools: <kind>_<tier>_<scene>_<n>. kind = apt | room | hostel | house | pent | villa;
tier = shabby | meh | normal | euro | lux. The manifest js/data/home_photos.js lists what exists.
"""
import argparse, io, json, os, random, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--jobs', type=int, default=6)
ap.add_argument('--force', action='store_true')
ap.add_argument('--model', default='fal-ai/flux/schnell')
ap.add_argument('--only', default='', help='comma-separated scene names to (re)generate, e.g. out,terrace')
args = ap.parse_args()
OUT = 'assets/homes'
KEY = os.environ.get('FAL_KEY', 'proxy-injected')

TIER = {
    'shabby': 'a shabby run-down neglected flat: peeling and torn wallpaper, worn old linoleum, water stains on the ceiling, broken old soviet furniture, dirty windows, a bare light bulb',
    'meh': 'a dated 1990s flat with an old-fashioned renovation: patterned wallpaper, a carpet hanging on the wall, an old lacquered wardrobe, worn parquet, old but clean',
    'normal': 'a simple tidy flat with a basic cosmetic renovation: white painted walls, laminate floor, simple modern furniture, clean',
    'euro': 'a freshly renovated modern flat: light grey walls, new wooden floor, built-in modern kitchen, recessed lights, stylish furniture',
    'lux': 'a luxury designer apartment: high-end materials, marble, designer lamps, expensive furniture, large windows',
}
SCENE_APT = {
    'room': 'the living room', 'bed': 'the bedroom', 'kitchen': 'the kitchen', 'bath': 'the bathroom',
}
OUTSIDE = {
    'shabby': 'an old shabby five-storey soviet panel apartment block with a worn facade and a messy courtyard',
    'meh': 'an old soviet brick apartment block (khrushchyovka) with a courtyard and old cars',
    'normal': 'a typical nine-storey apartment building with a tidy courtyard and a playground',
    'euro': 'a new modern residential complex with a landscaped courtyard',
    'lux': 'a premium modern glass residential tower with a concierge entrance',
}
HOUSE_OUT = {
    'shabby': 'an old run-down small wooden country house with a sagging roof and an overgrown yard',
    'meh': 'an old brick village house with a fence and a vegetable garden',
    'normal': 'a simple suburban family house with a garage and a small lawn',
    'euro': 'a new modern suburban house with a garage, large windows and a neat lawn',
    'lux': 'a large modern luxury house with a two-car garage and landscaped garden',
}
jobs = []
def add(key, prompt):
    jobs.append({'key': key, 'prompt': prompt})
def p(subject):
    return f"Wide-angle real estate photograph, natural daylight: {subject}. Realistic, ordinary, unedited. Empty scene: no people, no hands, no phones, no text, no watermark, no interface."
for tier, desc in TIER.items():
    for scene, what in SCENE_APT.items():
        for n in range(2):
            add(f'apt_{tier}_{scene}_{n}', p(f'{what} of {desc}'))
    for n in range(2):
        add(f'apt_{tier}_out_{n}', p(OUTSIDE[tier]))
        add(f'house_{tier}_out_{n}', p(HOUSE_OUT[tier]))
    for scene, what in [('room', 'the living room'), ('kitchen', 'the kitchen'), ('bath', 'the bathroom')]:
        for n in range(2):
            add(f'house_{tier}_{scene}_{n}', p(f"{what} inside a {'house' if tier in ('shabby', 'meh') else 'family house'}, {desc.replace('flat', 'house')}"))
for tier in ('shabby', 'meh', 'normal'):
    for scene, what in [('room', 'a single rented room in a shared flat with a bed, a desk and a wardrobe'), ('kitchen', 'a shared communal kitchen used by several tenants'), ('bath', 'a shared bathroom')]:
        for n in range(2):
            add(f'room_{tier}_{scene}_{n}', p(f'{what}, {TIER[tier]}'))
for tier, look in [('shabby', 'a cheap cramped hostel dorm with old metal bunk beds and worn lockers'), ('normal', 'a clean modern hostel dorm with wooden bunk beds, curtains and lockers')]:
    for scene, what in [('room', look), ('bath', 'the shared hostel bathroom with showers'), ('out', 'the hostel entrance on a city street')]:
        for n in range(2):
            add(f'hostel_{tier}_{scene}_{n}', p(what))
for tier in ('euro', 'lux'):
    for scene, what in [('room', 'the living room of a penthouse with floor-to-ceiling windows and a city skyline view'), ('terrace', 'the rooftop terrace of a penthouse with outdoor furniture and a city view'), ('kitchen', 'the open kitchen of a penthouse'), ('bath', 'the master bathroom of a penthouse')]:
        for n in range(2):
            add(f'pent_{tier}_{scene}_{n}', p(f"{what}, {'premium' if tier == 'lux' else 'modern'} design"))
    for scene, what in [('out', 'a modern villa with a swimming pool and a garden'), ('room', 'the spacious living room of a villa'), ('bed', 'the master bedroom of a villa'), ('bath', 'the bathroom of a villa')]:
        for n in range(2):
            add(f'villa_{tier}_{scene}_{n}', p(f"{what}, {'luxury' if tier == 'lux' else 'modern'} style"))

def call(prompt, seed):
    body = json.dumps({'prompt': prompt, 'image_size': {'width': 768, 'height': 576}, 'num_images': 1, 'seed': seed, 'enable_safety_checker': False}).encode()
    for k in range(5):
        try:
            req = urllib.request.Request(f'https://fal.run/{args.model}', data=body, headers={'Content-Type': 'application/json', 'Authorization': f'Key {KEY}'})
            with urllib.request.urlopen(req, timeout=180) as r: res = json.load(r)
            with urllib.request.urlopen(res['images'][0]['url'], timeout=120) as r: return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read()[:300]
            if e.code in (401, 403) and b'balance' in msg.lower(): raise SystemExit('fal.ai: balance exhausted')
            if e.code in (429, 500, 502, 503, 504): time.sleep(4 * (k + 1)); continue
            raise RuntimeError(f'{e.code} {msg}')
        except (TimeoutError, OSError):
            time.sleep(4 * (k + 1))
    raise RuntimeError('gave up')

def work(j):
    os.makedirs(OUT, exist_ok=True)
    seed = random.Random(j['key'] + ('|v2' if args.force else '')).randint(1, 2 ** 30)
    im = Image.open(io.BytesIO(call(j['prompt'], seed))).convert('RGB').resize((640, 480), Image.LANCZOS)
    tmp = os.path.join(OUT, j['key'] + '.tmp.webp')
    im.save(tmp, 'WEBP', quality=76, method=5)
    os.replace(tmp, os.path.join(OUT, j['key'] + '.webp'))
    return j['key']

only = set(filter(None, args.only.split(',')))
sel = [j for j in jobs if not only or j['key'].split('_')[2] in only]
todo = [j for j in sel if args.force or not os.path.exists(os.path.join(OUT, j['key'] + '.webp'))]
print(f'{len(todo)} to generate ({len(jobs) - len(todo)} done)', flush=True)
ok = 0
with ThreadPoolExecutor(args.jobs) as ex:
    futs = [ex.submit(work, j) for j in todo]
    for f in as_completed(futs):
        try: f.result(); ok += 1
        except SystemExit as e: print(e, flush=True); ex.shutdown(cancel_futures=True); break
        except Exception as e: print('fail', e, flush=True)
        if ok % 25 == 0: print(ok, flush=True)
keys = sorted(k[:-5] for k in os.listdir(OUT) if k.endswith('.webp') and '.tmp.' not in k)
open('js/data/home_photos.js', 'w').write('// generated by scripts/gen_homes_fal.py — real-estate photos that exist (assets/homes/<key>.webp)\nexport const HOME_PHOTOS = ' + json.dumps(keys) + ';\n')
print('done', ok, 'total', len(keys), flush=True)
