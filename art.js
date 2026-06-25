/* ============================================================================
 * art.js — pixel-art sprites drawn from data (still no imported asset files).
 * ----------------------------------------------------------------------------
 * Each sprite is a little grid of characters. A palette maps each character to
 * a color; '.' (or a space) means transparent. We render the grid one pixel at
 * a time into a Phaser texture. This gives real pixel-art control — outlines,
 * shading, highlights — instead of flat geometric shapes.
 *
 * To edit a sprite, just change the characters in its grid below and reload.
 * ==========================================================================*/

const PALETTE = {
  // shared
  K: 0x1b1008, // dark outline
  W: 0xffffff, // eye white
  E: 0x141414, // pupil
  // hero (chipmunk-ish, warm orange)
  O: 0xc87328, // body
  L: 0xe89c4a, // body highlight
  D: 0x934e1e, // body shadow
  B: 0xf5dcab, // belly cream
  P: 0xe79a86, // pink inner ear
  N: 0x7a4322, // nose
  // crate (wood)
  z: 0x5a3416, // outline / brace
  w: 0xb07434, // wood mid
  y: 0xcf9354, // wood light
  // enemy (green critter)
  q: 0x2a5418, // outline
  g: 0x5fae3a, // body
  m: 0x82d04f, // body light
  h: 0x3d7a26, // body shadow
  // acorn
  C: 0x6e4a23, // cap
  a: 0xd9a066, // nut
  A: 0xecc196, // nut highlight
  // ground tile
  t: 0x5aa83c, // grass
  T: 0x3f7e2a, // grass shadow
  r: 0x7a5230, // dirt
  R: 0x5e3d22, // dirt shadow
};

// The hero faces the screen; flipX handles left/right. Outlined + shaded.
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

const ENEMY = [
  '....qqqqqqqq....',
  '..qqmmmmmmmmqq..',
  '.qmmmmmmmmmmmmq.',
  '.qmmgggggggmmmq.',
  'qmmgggggggggggmq',
  'qmgggWWgggWWgggq',
  'qmgggEWgggEWgggq',
  'qmgggggggggggggq',
  'qmgggggggggggggq',
  'qmmggghhhhgggmmq',
  '.qmmgggggggggmq.',
  '..qmgggggggggq..',
  '...qqmggggmqq...',
  '...qq......qq...',
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

// A 16x16 ground tile: a grassy top over dirt, designed to tile seamlessly.
const GROUND = [
  'tttttttttttttttt',
  'tTttTtttTtttTttt',
  'TtttTtttTtttTttt',
  'rrrrrrrrrrrrrrrr',
  'rrrRrrrrrrrrRrrr',
  'rrrrrrrrRrrrrrrr',
  'rRrrrrrrrrrrrrRr',
  'rrrrrrRrrrrRrrrr',
  'rrrrrrrrrrrrrrrr',
  'rrRrrrrrrrRrrrrr',
  'rrrrrrrrRrrrrrrr',
  'rRrrrrRrrrrrrrRr',
  'rrrrrrrrrrrrRrrr',
  'rrrRrrrrrrrrrrrr',
  'rrrrrrrrrRrrrrRr',
  'rrrrRrrrrrrrrrrr',
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
  renderSprite(scene, 'enemy', ENEMY);
  renderSprite(scene, 'acorn', ACORN);
  renderSprite(scene, 'ground', GROUND);

  // A 1x1 white pixel, used for invisible collision bodies.
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, 1, 1);
  g.generateTexture('pixel', 1, 1);
  g.destroy();
}
