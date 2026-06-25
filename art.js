/* ============================================================================
 * art.js — original pixel-art sprites drawn from data (no imported asset files).
 * ----------------------------------------------------------------------------
 * Each sprite is a grid of characters. A palette maps each character to a color;
 * '.' (or a space) is transparent. We render the grid one pixel at a time into a
 * Phaser texture — real pixel-art control (outlines, shading) with no PNGs.
 *
 * Art direction: an outdoor "back alley / construction" zone — cobblestone
 * pavement, brick walls, tall wooden-plank blocks, potted plants, trash cans,
 * with food (apples) and crates to throw, and a mechanical-dog henchman.
 * Drawn fresh; the classic game is reference only.
 *
 * To edit a sprite, change the characters in its grid below and reload.
 * ==========================================================================*/

const PALETTE = {
  // shared
  K: 0x1b1008, // dark outline
  W: 0xffffff, // white / teeth
  E: 0x141414, // pupil
  // hero (chipmunk, warm orange)
  O: 0xc87328, // body
  L: 0xe89c4a, // body highlight
  D: 0x934e1e, // body shadow
  B: 0xf5dcab, // belly cream
  P: 0xe79a86, // pink inner ear
  N: 0x7a4322, // nose
  // wood (crate + plank blocks)
  z: 0x5a3416, // seam / brace
  w: 0xb07434, // wood mid
  y: 0xcf9354, // wood light
  u: 0x3c220e, // wood deep shadow
  // steel (mechanical dog + trash can)
  S: 0x9aa3ad, // steel
  i: 0xc7cdd4, // steel highlight
  s: 0x5e6670, // steel shadow
  b: 0x33383f, // bolt / wheel
  X: 0xe23b3b, // red sensor eye
  // acorn
  C: 0x6e4a23, // cap / stem
  a: 0xd9a066, // nut
  A: 0xecc196, // nut highlight
  // apple + heart (reds)
  p: 0xd0241f, // red
  o: 0x9c1712, // red shadow
  e: 0xf2685c, // red highlight
  l: 0x4a9a3a, // leaf green
  // potted plant
  g: 0x3f9a3a, // foliage
  m: 0xe2b23a, // flower
  h: 0xc06a3a, // terracotta pot
  q: 0x8f4a26, // pot shadow
  // cobblestone
  6: 0xc2c6cc, // stone light
  7: 0x9398a0, // stone
  8: 0x6b7178, // mortar
};

// Hero — a chipmunk. Faces the screen; flipX gives left/right.
const HERO = [
  '....KK....KK....',
  '...KOOK..KOOK...',
  '...KOPK..KOPK...',
  '..KOOOKKKKOOOK..',
  '.KOOOOOOOOOOOOK.',
  '.KOLLLLLLLLLLOK.',
  '.KOLLLLLLLLLLOK.',
  '.KOLWWELLEWWLOK.',
  '.KOLWWELLEWWLOK.',
  '.KOOLLLNNLLLOOK.',
  '.KOOLLLLLLLLOOK.',
  '..KOOBBBBBBOOK..',
  '..KOBBBBBBBBOK..',
  '..KOBBBBBBBBOK..',
  '..KOOBBBBBBOOK..',
  '...KOOK..KOOK...',
  '...KK......KK...',
];

const HERO_CROUCH = [
  '..KOOOKKKKOOOK..',
  '.KOOOOOOOOOOOOK.',
  '.KOLWWELLEWWLOK.',
  '.KOLWWELLEWWLOK.',
  '.KOOLLLNNLLLOOK.',
  '.KOOBBBBBBBBOOK.',
  '.KOBBBBBBBBBBOK.',
  '.KOOBBBBBBBBOOK.',
  '..KOOOOOOOOOOK..',
  '..KOOK....KOOK..',
];

// Wooden crate (throwable), with an X-brace.
const CRATE = [
  'zzzzzzzzzzzzzzzz',
  'zyywwwwwwwwwwwyz',
  'zwzwwwwwwwwwwzwz',
  'zwwzwwwwwwwwzwwz',
  'zwwwzwwwwwwzwwwz',
  'zwwwwzwwwwzwwwwz',
  'zwwwwwzwwzwwwwwz',
  'zwwwwwwzzwwwwwwz',
  'zwwwwwwzzwwwwwwz',
  'zwwwwwzwwzwwwwwz',
  'zwwwwzwwwwzwwwwz',
  'zwwwzwwwwwwzwwwz',
  'zwwzwwwwwwwwzwwz',
  'zwzwwwwwwwwwwzwz',
  'zyzwwwwwwwwwwzyz',
  'zzzzzzzzzzzzzzzz',
];

// Apple (throwable food + decoration).
const APPLE = [
  '......CC......',
  '.....CCll.....',
  '....llClll....',
  '...pppppppp...',
  '..peppppppoo..',
  '.peppppppppoo.',
  '.eppppppppppo.',
  'peppppppppppoo',
  'peppppppppppoo',
  '.ppppppppppoo.',
  '.ppppppppppoo.',
  '..pppppppppo..',
  '...ppppppoo...',
  '....oooooo....',
];

// Mechanical dog — a steel henchman with jagged teeth and a red eye. Faces left.
const ENEMY = [
  '.......KKKKKKK......',
  '.....KKiiSSSSSKK....',
  '...KKiSSSSSSSSSSK...',
  '..KSSSSSSSSSSSSSSK..',
  '.KSSXXSSSSSSSSSSSSK.',
  '.KSSXXSSSSSSSSSSSsK.',
  'KSSSSSSSSSSSSSSSSssK',
  'KWWKSSSSSSSSSSSSSssK',
  'KWKWKSSSSSSSSSSSsssK',
  'KWKWKSSSSSSSSSSKKssK',
  '.KKKKSSSSSSSSSKsssK.',
  '..KSSSSSSSSSSSKKK...',
  '..KbKSSSSSSSKbK.....',
  '..KWbK.....KWbK.....',
  '...KK.......KK......',
];

const ACORN = [
  '..KKKKKKKK..',
  '.KCCCCCCCCK.',
  '.KCCCCCCCCK.',
  '.KKKKKKKKKK.',
  '..KaaaaaaK..',
  '.KaAaaaaaaK.',
  '.KaaaaaaaaK.',
  '.KaaaaaaaaK.',
  '..KaaaaaaK..',
  '..KKaaaaKK..',
  '...KKaaKK...',
  '....KKKK....',
];

// Potted plant — a decorative prop on ledges.
const PLANT = [
  '....m..m..m.....',
  '...mgmgmgmgm....',
  '..gggggggggggg..',
  '.gggggggggggggg.',
  '..gggggggggggg..',
  '...gg.gg.gg.g...',
  '.....g.gg.g.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hqhhhhhhqh...',
  '...qhhhhhhhhq...',
  '...qhhhhhhhhq...',
  '....qhhhhhhq....',
  '....qqqqqqqq....',
];

// Trash can — a decorative prop.
const TRASHCAN = [
  '..iiiiiiiiii..',
  '.iSSSSSSSSSSi.',
  '.sSSSSSSSSSSs.',
  '..isSsiSsiSi..',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.iSsiSsiSsiSi.',
  '.sSSSSSSSSSSs.',
  '.iiiiiiiiiiii.',
];

const HEART = [
  '.oo..oo.',
  'oppppppo',
  'oepppppo',
  '.pppppp.',
  '..pppp..',
  '...pp...',
];

// 16x16 vertical wooden-plank block (the tall brown platforms/blocks).
const WOODBLOCK = [
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwzwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwzyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwzyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwzwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
  'uwzwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwzyu',
  'uwwwyzwwwyzwwwyu',
  'uwwwyzwwwyzwwwyu',
];

// 16x16 cobblestone pavement (the ground floor), brick-coursed.
const COBBLE = [
  '8666666686666666',
  '8666666686666666',
  '8777777787777777',
  '8888888888888888',
  '6666866666668666',
  '6666866666668666',
  '7777877777778777',
  '8888888888888888',
  '8666666686666666',
  '8666666686666666',
  '8777777787777777',
  '8888888888888888',
  '6666866666668666',
  '6666866666668666',
  '7777877777778777',
  '8888888888888888',
];

// Render one character grid into a Phaser texture under the given key.
function renderSprite(scene, key, grid, scale = 1) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const w = Math.max(...grid.map((r) => r.length));
  const h = grid.length;
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (color === undefined || ch === '.' || ch === ' ') continue;
      g.fillStyle(color, 1);
      g.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  g.generateTexture(key, w * scale, h * scale);
  g.destroy();
}

// Build every game texture. Called once from the scene's create().
function buildTextures(scene) {
  renderSprite(scene, 'hero', HERO);
  renderSprite(scene, 'heroCrouch', HERO_CROUCH);
  renderSprite(scene, 'crate', CRATE);
  renderSprite(scene, 'apple', APPLE);
  renderSprite(scene, 'enemy', ENEMY);
  renderSprite(scene, 'acorn', ACORN);
  renderSprite(scene, 'plant', PLANT);
  renderSprite(scene, 'trashcan', TRASHCAN);
  renderSprite(scene, 'heart', HEART);
  renderSprite(scene, 'woodblock', WOODBLOCK);
  renderSprite(scene, 'cobble', COBBLE);

  // A 1x1 white pixel, used for invisible collision bodies.
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 1, 1);
  g.generateTexture('pixel', 1, 1);
  g.destroy();
}
