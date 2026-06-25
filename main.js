/* ============================================================================
 * Box-Throw Platformer — a learning prototype
 * ----------------------------------------------------------------------------
 * Goal: recreate the *mechanics* of a classic NES rescue-platformer (run, jump,
 * crouch, pick up a crate, carry it, throw it at an enemy, collect acorns) so
 * you can read and tinker with how each piece works.
 *
 * Everything you see is drawn from code as colored shapes — there are NO
 * imported sprites, music, or backgrounds. That keeps the project 100% original
 * and means it runs with zero downloads. Once the feel is right, we can swap
 * these shapes for original pixel art.
 *
 * Engine: Phaser 3 (loaded from a CDN in index.html).
 * ==========================================================================*/

// ---- Tunable constants -----------------------------------------------------
// Keeping the "feel" numbers in one place makes the game easy to tweak. Change
// these and reload to feel how each one affects the platforming.
const TUNING = {
  width: 480,            // game canvas width  (logical pixels)
  height: 270,           // game canvas height
  gravity: 900,          // downward pull; bigger = floatier jumps feel heavier
  moveSpeed: 140,        // horizontal run speed
  jumpVelocity: 360,     // initial upward burst when you jump
  throwSpeed: 320,       // horizontal speed of a thrown crate
  throwLift: 120,        // small upward kick so throws arc a little
};

// Texture generation now lives in art.js (buildTextures + pixel-art sprites).

// Helper: a platform = an INVISIBLE static collision body + a visible tiled
// texture on top. Tiling keeps the pixel art crisp at any width instead of
// stretching one image. `tileKey` picks the surface (cobble floor, wood block).
function addPlatform(scene, x, y, w, h, tileKey = 'woodblock') {
  const body = scene.platforms.create(x, y, 'pixel');
  body.setDisplaySize(w, h).refreshBody();
  body.setVisible(false);
  const tile = scene.add.tileSprite(x, y, w, h, tileKey);
  tile.setDepth(-1);   // sit behind the player and entities
  return body;
}

// ---------------------------------------------------------------------------
// The single game Scene. In Phaser, a Scene has three key lifecycle methods:
//   preload() — load assets (we generate ours instead)
//   create()  — build the level once
//   update()  — run every frame (~60x/sec); this is where input + logic live
// ---------------------------------------------------------------------------
class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    // 1) Build all our pixel-art textures up front (see art.js).
    buildTextures(this);

    // 1b) Paint the back-alley backdrop (brick wall + windows).
    this.buildBackground();

    // 2) Static world geometry: cobblestone floor + tall wooden-plank blocks.
    this.platforms = this.physics.add.staticGroup();
    addPlatform(this, 240, 262, 480, 16, 'cobble');   // pavement
    addPlatform(this, 110, 200, 120, 12, 'woodblock'); // low ledge
    addPlatform(this, 340, 160, 120, 12, 'woodblock'); // mid ledge
    addPlatform(this, 240, 110, 90, 12, 'woodblock');  // high ledge

    // 2b) Decorative props that sell the setting (no collision).
    this.add.image(70, 188, 'plant').setDepth(0);
    this.add.image(430, 240, 'trashcan').setDepth(0);

    // 3) The hero. Arcade Physics gives us gravity + collisions for free.
    this.hero = this.physics.add.sprite(60, 200, 'hero');
    this.hero.setCollideWorldBounds(true);
    this.hero.facing = 1;          // 1 = right, -1 = left (for throw direction)
    this.hero.carrying = null;     // the crate currently held, if any
    this.hero.crouching = false;
    this.physics.add.collider(this.hero, this.platforms);

    // 4) Throwables — crates AND apples share one group, so the grab/throw code
    //    treats them identically (just different art). Each falls, stacks, and
    //    can be picked up and chucked at enemies.
    this.crates = this.physics.add.group();
    const addThrowable = (x, y, tex) => {
      const c = this.crates.create(x, y, tex);
      c.setCollideWorldBounds(true);
      c.held = false;             // is the hero currently holding it?
      c.thrown = false;           // is it mid-flight from a throw?
    };
    [180, 300, 360].forEach((x) => addThrowable(x, 120, 'crate'));
    addThrowable(150, 120, 'apple');
    addThrowable(390, 120, 'apple');
    this.physics.add.collider(this.crates, this.platforms);
    this.physics.add.collider(this.crates, this.crates);  // they stack

    // 5) Enemies that patrol back and forth on the ground.
    this.enemies = this.physics.add.group();
    this.spawnEnemy(280, 240, 60);
    this.physics.add.collider(this.enemies, this.platforms);

    // 6) Acorns to collect, scattered on the ledges.
    this.acorns = this.physics.add.staticGroup();
    [[110, 185], [340, 145], [240, 95], [190, 244]].forEach(([x, y]) => {
      this.acorns.create(x, y, 'acorn');
    });

    // --- Collision/overlap rules that drive the gameplay --------------------
    // Picking up an acorn: overlap = touch without solid blocking.
    this.physics.add.overlap(this.hero, this.acorns, (hero, acorn) => {
      acorn.destroy();
      this.score += 1;
      this.updateHud();
    });

    // A THROWN crate that hits an enemy defeats it. A held/idle crate doesn't.
    this.physics.add.overlap(this.crates, this.enemies, (crate, enemy) => {
      if (crate.thrown) {
        enemy.destroy();
        crate.thrown = false;
        crate.setVelocity(0, crate.body.velocity.y);
      }
    });

    // Touching an enemy on foot costs a life and respawns you.
    this.physics.add.overlap(this.hero, this.enemies, () => this.hurt());

    // 7) Input. Arrow keys for movement; Z to jump, X to grab/throw.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyGrab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // 8) HUD: an acorn counter (text) plus heart icons for health.
    this.score = 0;
    this.lives = 3;
    this.hud = this.add.text(8, 6, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setDepth(100);
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const himg = this.add.image(120 + i * 14, 12, 'heart').setDepth(100);
      this.hearts.push(himg);
    }
    this.updateHud();
  }

  // Paint the back-alley backdrop: a gray brick wall with a couple of windows.
  // The signature scale comes from the cobblestone + giant plank blocks in
  // front; the wall sits far behind everything (negative depth).
  buildBackground() {
    const W = TUNING.width;
    const H = TUNING.height;
    const bg = this.add.graphics();
    bg.setDepth(-10);

    // Brick wall: mortar-colored base, then offset brick courses on top.
    bg.fillStyle(0x6b7178, 1);
    bg.fillRect(0, 0, W, H);
    const bw = 30, bh = 14;            // brick width / height (incl. mortar gap)
    for (let row = 0, y = 0; y < H; row++, y += bh) {
      const offset = row % 2 ? -bw / 2 : 0;
      for (let x = offset; x < W; x += bw) {
        bg.fillStyle(0x8a8f96, 1);
        bg.fillRect(x + 1, y + 1, bw - 2, bh - 2);
        bg.fillStyle(0xa6abb2, 1);     // top highlight on each brick
        bg.fillRect(x + 1, y + 1, bw - 2, 2);
      }
    }

    // Two daylight windows (blue panes with a diagonal glass shine + frame).
    const window = (wx, wy) => {
      const ww = 70, wh = 46;
      bg.fillStyle(0x5bb3d6, 1);
      bg.fillRect(wx, wy, ww, wh);
      bg.fillStyle(0xcdeef8, 0.7);                 // diagonal shine streaks
      bg.fillTriangle(wx + 8, wy + wh, wx + 26, wy, wx + 36, wy);
      bg.fillTriangle(wx + 40, wy + wh, wx + 54, wy, wx + 60, wy);
      bg.fillStyle(0x7a4a22, 1);                   // frame + muntins
      bg.fillRect(wx - 4, wy - 4, ww + 8, 4);
      bg.fillRect(wx - 4, wy + wh, ww + 8, 4);
      bg.fillRect(wx - 4, wy - 4, 4, wh + 8);
      bg.fillRect(wx + ww, wy - 4, 4, wh + 8);
      bg.fillRect(wx + ww / 2 - 2, wy, 4, wh);
      bg.fillRect(wx, wy + wh / 2 - 2, ww, 4);
    };
    window(70, 30);
    window(300, 24);
  }

  // Create one patrolling enemy. `range` = how far it walks before turning.
  spawnEnemy(x, y, range) {
    const e = this.enemies.create(x, y, 'enemy');
    e.setCollideWorldBounds(true);
    e.setVelocityX(-40);
    e.startX = x;
    e.range = range;
    return e;
  }

  updateHud() {
    this.hud.setText(`Acorns: ${this.score}`);
    // Show one heart per remaining life; dim the lost ones.
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.2));
  }

  // Lose a life and reset the hero to the start.
  hurt() {
    this.lives -= 1;
    this.updateHud();
    if (this.carriedDrop) this.carriedDrop();
    this.hero.setPosition(60, 200);
    this.hero.setVelocity(0, 0);
    if (this.lives <= 0) {
      this.scene.restart();   // simplest possible "game over" for now
    }
  }

  // ---- The per-frame loop --------------------------------------------------
  update() {
    const hero = this.hero;
    const onGround = hero.body.blocked.down;

    // CROUCH: hold Down while grounded. Swaps to the squashed sprite and
    // stops horizontal movement (just like the classic duck).
    hero.crouching = this.cursors.down.isDown && onGround && !hero.carrying;
    hero.setTexture(hero.crouching ? 'heroCrouch' : 'hero');

    // HORIZONTAL MOVEMENT (disabled while crouching).
    if (!hero.crouching && this.cursors.left.isDown) {
      hero.setVelocityX(-TUNING.moveSpeed);
      hero.facing = -1;
      hero.setFlipX(true);
    } else if (!hero.crouching && this.cursors.right.isDown) {
      hero.setVelocityX(TUNING.moveSpeed);
      hero.facing = 1;
      hero.setFlipX(false);
    } else {
      hero.setVelocityX(0);
    }

    // JUMP: up-arrow or Z, only when standing on something.
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keyJump) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (jumpPressed && onGround && !hero.crouching) {
      hero.setVelocityY(-TUNING.jumpVelocity);
    }

    // GRAB / THROW: X picks up a nearby crate, or throws the one you hold.
    if (Phaser.Input.Keyboard.JustDown(this.keyGrab)) {
      if (hero.carrying) {
        this.throwCrate();
      } else {
        this.tryGrabCrate();
      }
    }

    // Keep a held crate glued just above the hero's head each frame.
    if (hero.carrying) {
      const c = hero.carrying;
      c.setVelocity(0, 0);
      c.body.allowGravity = false;
      c.setPosition(hero.x, hero.y - 18);
    }

    // A thrown crate stops being "dangerous" once it lands and slows down.
    this.crates.children.iterate((c) => {
      if (c && c.thrown && c.body.blocked.down) {
        c.thrown = false;
        c.setVelocityX(0);
      }
    });

    // Enemy patrol: flip direction at the edges of its range.
    this.enemies.children.iterate((e) => {
      if (!e) return;
      if (e.x < e.startX - e.range) e.setVelocityX(40);
      else if (e.x > e.startX + e.range) e.setVelocityX(-40);
      e.setFlipX(e.body.velocity.x > 0);
    });
  }

  // Find the closest crate within reach and pick it up.
  tryGrabCrate() {
    const hero = this.hero;
    let best = null;
    let bestDist = 28;   // grab radius in pixels
    this.crates.children.iterate((c) => {
      if (!c || c.held) return;
      const d = Phaser.Math.Distance.Between(hero.x, hero.y, c.x, c.y);
      if (d < bestDist) { bestDist = d; best = c; }
    });
    if (best) {
      best.held = true;
      best.thrown = false;
      best.body.allowGravity = false;
      hero.carrying = best;
      // Give hurt() a way to drop the crate on respawn.
      this.carriedDrop = () => this.dropCrate();
    }
  }

  // Release the held crate without throwing it (used on respawn).
  dropCrate() {
    const c = this.hero.carrying;
    if (!c) return;
    c.held = false;
    c.body.allowGravity = true;
    this.hero.carrying = null;
    this.carriedDrop = null;
  }

  // Launch the held crate in the direction the hero faces.
  throwCrate() {
    const hero = this.hero;
    const c = hero.carrying;
    if (!c) return;
    c.held = false;
    c.thrown = true;
    c.body.allowGravity = true;
    c.setPosition(hero.x + hero.facing * 14, hero.y - 6);
    c.setVelocity(TUNING.throwSpeed * hero.facing, -TUNING.throwLift);
    c.setAngularVelocity(hero.facing * 400);  // spin for visual flair
    hero.carrying = null;
    this.carriedDrop = null;
  }
}

// ---- Boot the game ---------------------------------------------------------
const config = {
  type: Phaser.AUTO,
  width: TUNING.width,
  height: TUNING.height,
  parent: 'game',
  pixelArt: true,
  backgroundColor: '#1d2b53',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: TUNING.gravity }, debug: false },
  },
  scene: [GameScene],
};

// eslint-disable-next-line no-unused-vars
const game = new Phaser.Game(config);
