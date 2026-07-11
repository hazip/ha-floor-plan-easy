// ─────────────────────────────────────────────────────────────────────────
// Built-in pattern libraries.
//
// Every value is an SVG string with `viewBox="0 0 100 100"` and uses
// `currentColor` for stroke/fill so the color picked in the editor is applied
// at render time (see FloorRenderer._applyBackground / _renderSvgLayer, which
// replace `currentColor` with the chosen color).
//
// Rendering facts these graphics are designed around:
//   • Each tile is a SQUARE, and the SVG is stretched to fill it exactly
//     (`background-size: 100% 100%`) — so the 0..100 viewBox maps onto the tile.
//     Point (0,0) is the tile's top-left corner, (100,100) its bottom-right.
//   • BACKGROUND patterns sit under everything (the floor). WALL patterns are
//     an overlay above the floor (z-index 5). OBJECT patterns are a second
//     overlay above the wall (z-index 7) but below tile content/icons.
//   • A tile has ONE background, ONE wall and ONE object. Structural walls,
//     door OPENINGS and windows live in the WALL registry. Furniture and door
//     LEAVES (the swing) live in the OBJECT registry so they can sit on top of
//     a wall in the same tile. A door is authored as two picks: the opening
//     (wall) and the matching leaf (object).
//
// TILEABILITY: floor materials are built so their motif lines up at the 0/100
// edges — placed across adjacent tiles they read as one continuous surface
// (planks run through, grids align, waves connect) rather than a boxed motif.
// ─────────────────────────────────────────────────────────────────────────

// These SVGs are painted as CSS backgrounds with `background-size: 100% 100%`
// (see FloorRenderer / styles.js), which stretches them to the exact tile size so
// the motif always reaches every edge — the tile and the 0..100 viewBox are both
// square, so there is no distortion. `width`/`height` are also declared (not just
// `viewBox`) so the SVG has a definite intrinsic size if ever rendered any other
// way (e.g. as an <img> or with `contain`).
const svg = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${body}</svg>`;

// ── Structural walls ───────────────────────────────────────────────────────
// Solid bars along tile edges. Combining edges gives corners / T / cross.
// Thickness is a fraction of the tile so double walls (a wall marked on both
// sides of a shared grid line) still stay reasonable.
const WT = 12; // wall thickness, in viewBox units
const EDGE = {
    top:    `<rect x="0" y="0" width="100" height="${WT}" fill="currentColor"/>`,
    bottom: `<rect x="0" y="${100 - WT}" width="100" height="${WT}" fill="currentColor"/>`,
    left:   `<rect x="0" y="0" width="${WT}" height="100" fill="currentColor"/>`,
    right:  `<rect x="${100 - WT}" y="0" width="${WT}" height="100" fill="currentColor"/>`,
};
const wall = (...sides) => svg(sides.map((s) => EDGE[s]).join(""));

// ── Door openings (WALL layer) ───────────────────────────────────────────────
// Just the wall break: two stubs with a gap between them. The gap is identical
// for a left- or right-hinged door, so there is a single opening per edge — the
// swing direction is carried by the matching door leaf in the OBJECT layer.
const DOOR = {
    top: svg(
        `<rect x="0" y="0" width="30" height="${WT}" fill="currentColor"/>` +
        `<rect x="70" y="0" width="30" height="${WT}" fill="currentColor"/>`
    ),
    bottom: svg(
        `<rect x="0" y="${100 - WT}" width="30" height="${WT}" fill="currentColor"/>` +
        `<rect x="70" y="${100 - WT}" width="30" height="${WT}" fill="currentColor"/>`
    ),
    left: svg(
        `<rect x="0" y="0" width="${WT}" height="30" fill="currentColor"/>` +
        `<rect x="0" y="70" width="${WT}" height="30" fill="currentColor"/>`
    ),
    right: svg(
        `<rect x="${100 - WT}" y="0" width="${WT}" height="30" fill="currentColor"/>` +
        `<rect x="${100 - WT}" y="70" width="${WT}" height="30" fill="currentColor"/>`
    ),
};

// ── Door leaves (OBJECT layer) ───────────────────────────────────────────────
// The swinging panel + its arc, bulging INTO the tile (the room). NO wall stub —
// the opening is drawn separately in the WALL layer. Each edge has two variants:
// the default (hinge on the first jamb) and `*Alt` (hinge on the opposite jamb —
// the door opens the other way). Geometry matches the DOOR openings above so a
// leaf lines up inside its opening's gap.
//
// The hinge sits `inset` units from the near edge — `WT` so the leaf starts at
// the inner face of the wall, or `0` for the edge-aligned variant flush with the
// tile boundary. The panel is `LEAF_LEN` long (== the swing radius). The panel
// line is drawn thicker than the arc so the door itself reads clearly; the arc
// keeps its thin sweep.
const LEAF_LEN = 40;   // door panel length == swing arc radius
const LEAF_W = 5;      // panel stroke (the door itself — bold)
const ARC_W = 1.2;     // swing-arc stroke (thin sweep)

// Panel line + swing arc for one orientation at a given hinge inset.
const DOOR_LEAF_BODY = {
    top:       (i) => `<line x1="30" y1="${i}" x2="30" y2="${i + LEAF_LEN}" stroke-width="${LEAF_W}"/><path d="M30,${i + LEAF_LEN} A40,40 0 0 0 70,${i}" stroke-width="${ARC_W}"/>`,
    topAlt:    (i) => `<line x1="70" y1="${i}" x2="70" y2="${i + LEAF_LEN}" stroke-width="${LEAF_W}"/><path d="M70,${i + LEAF_LEN} A40,40 0 0 1 30,${i}" stroke-width="${ARC_W}"/>`,
    bottom:    (i) => `<line x1="30" y1="${100 - i}" x2="30" y2="${100 - i - LEAF_LEN}" stroke-width="${LEAF_W}"/><path d="M30,${100 - i - LEAF_LEN} A40,40 0 0 1 70,${100 - i}" stroke-width="${ARC_W}"/>`,
    bottomAlt: (i) => `<line x1="70" y1="${100 - i}" x2="70" y2="${100 - i - LEAF_LEN}" stroke-width="${LEAF_W}"/><path d="M70,${100 - i - LEAF_LEN} A40,40 0 0 0 30,${100 - i}" stroke-width="${ARC_W}"/>`,
    left:      (i) => `<line x1="${i}" y1="30" x2="${i + LEAF_LEN}" y2="30" stroke-width="${LEAF_W}"/><path d="M${i + LEAF_LEN},30 A40,40 0 0 1 ${i},70" stroke-width="${ARC_W}"/>`,
    leftAlt:   (i) => `<line x1="${i}" y1="70" x2="${i + LEAF_LEN}" y2="70" stroke-width="${LEAF_W}"/><path d="M${i + LEAF_LEN},70 A40,40 0 0 0 ${i},30" stroke-width="${ARC_W}"/>`,
    right:     (i) => `<line x1="${100 - i}" y1="30" x2="${100 - i - LEAF_LEN}" y2="30" stroke-width="${LEAF_W}"/><path d="M${100 - i - LEAF_LEN},30 A40,40 0 0 0 ${100 - i},70" stroke-width="${ARC_W}"/>`,
    rightAlt:  (i) => `<line x1="${100 - i}" y1="70" x2="${100 - i - LEAF_LEN}" y2="70" stroke-width="${LEAF_W}"/><path d="M${100 - i - LEAF_LEN},70 A40,40 0 0 1 ${100 - i},30" stroke-width="${ARC_W}"/>`,
};

const doorLeaf = (orient, inset) =>
    svg(`<g fill="none" stroke="currentColor">${DOOR_LEAF_BODY[orient](inset)}</g>`);
const WIN = {
    top: svg(
        `<rect x="0" y="0" width="15" height="${WT}" fill="currentColor"/>` +
        `<rect x="85" y="0" width="15" height="${WT}" fill="currentColor"/>` +
        `<g fill="none" stroke="currentColor" stroke-width="2">` +
        `<rect x="15" y="3" width="70" height="6"/><line x1="15" y1="6" x2="85" y2="6"/></g>`
    ),
    bottom: svg(
        `<rect x="0" y="${100 - WT}" width="15" height="${WT}" fill="currentColor"/>` +
        `<rect x="85" y="${100 - WT}" width="15" height="${WT}" fill="currentColor"/>` +
        `<g fill="none" stroke="currentColor" stroke-width="2">` +
        `<rect x="15" y="91" width="70" height="6"/><line x1="15" y1="94" x2="85" y2="94"/></g>`
    ),
    left: svg(
        `<rect x="0" y="0" width="${WT}" height="15" fill="currentColor"/>` +
        `<rect x="0" y="85" width="${WT}" height="15" fill="currentColor"/>` +
        `<g fill="none" stroke="currentColor" stroke-width="2">` +
        `<rect x="3" y="15" width="6" height="70"/><line x1="6" y1="15" x2="6" y2="85"/></g>`
    ),
    right: svg(
        `<rect x="${100 - WT}" y="0" width="${WT}" height="15" fill="currentColor"/>` +
        `<rect x="${100 - WT}" y="85" width="${WT}" height="15" fill="currentColor"/>` +
        `<g fill="none" stroke="currentColor" stroke-width="2">` +
        `<rect x="91" y="15" width="6" height="70"/><line x1="94" y1="15" x2="94" y2="85"/></g>`
    ),
};

// ── Furniture / decor (drawn in the OBJECT overlay layer) ────────────────────
// Single-tile line-art silhouettes, centered with a margin. `stroke`/`fill`
// use currentColor so they recolor with the object color picker.
const FURNITURE = {
    "bed": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="22" y="14" width="56" height="72" rx="5"/>` +
        `<rect x="28" y="20" width="44" height="16" rx="3" stroke-width="2.5"/>` +
        `<line x1="22" y1="44" x2="78" y2="44" stroke-width="2.5"/></g>`
    ),
    "sofa": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="16" y="24" width="68" height="52" rx="8"/>` +
        `<rect x="24" y="20" width="52" height="18" rx="6" stroke-width="2.5"/>` +
        `<line x1="50" y1="40" x2="50" y2="72" stroke-width="2.5"/></g>`
    ),
    "table-dining": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="30" y="32" width="40" height="36" rx="3"/>` +
        `<g stroke-width="2.5">` +
        `<rect x="34" y="16" width="32" height="10" rx="2"/>` +
        `<rect x="34" y="74" width="32" height="10" rx="2"/>` +
        `<rect x="14" y="36" width="10" height="28" rx="2"/>` +
        `<rect x="76" y="36" width="10" height="28" rx="2"/></g></g>`
    ),
    "table-round": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<circle cx="50" cy="50" r="22"/>` +
        `<g stroke-width="2.5">` +
        `<circle cx="50" cy="18" r="7"/><circle cx="50" cy="82" r="7"/>` +
        `<circle cx="18" cy="50" r="7"/><circle cx="82" cy="50" r="7"/></g></g>`
    ),
    "toilet": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="34" y="16" width="32" height="14" rx="2"/>` +
        `<ellipse cx="50" cy="56" rx="18" ry="24"/></g>`
    ),
    "bathtub": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="18" y="26" width="64" height="48" rx="12"/>` +
        `<rect x="26" y="33" width="48" height="34" rx="8" stroke-width="2.5"/></g>` +
        `<circle cx="68" cy="50" r="3" fill="currentColor"/>`
    ),
    "shower": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="22" y="22" width="56" height="56" rx="4"/>` +
        `<circle cx="50" cy="50" r="4" stroke-width="2"/>` +
        `<line x1="22" y1="22" x2="78" y2="78" stroke-width="1.5" stroke-dasharray="4 4"/></g>` +
        `<circle cx="31" cy="31" r="3" fill="currentColor"/>`
    ),
    "sink": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="24" y="30" width="52" height="42" rx="8"/>` +
        `<rect x="32" y="37" width="36" height="24" rx="6" stroke-width="2.5"/></g>` +
        `<circle cx="50" cy="30" r="3" fill="currentColor"/>`
    ),
    "stove": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="22" y="22" width="56" height="56" rx="4"/>` +
        `<g stroke-width="2.5">` +
        `<circle cx="38" cy="38" r="9"/><circle cx="62" cy="38" r="9"/>` +
        `<circle cx="38" cy="62" r="9"/><circle cx="62" cy="62" r="9"/></g></g>`
    ),
    "fridge": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="30" y="14" width="40" height="72" rx="4"/>` +
        `<g stroke-width="2.5">` +
        `<line x1="30" y1="42" x2="70" y2="42"/>` +
        `<line x1="62" y1="28" x2="62" y2="38"/>` +
        `<line x1="62" y1="50" x2="62" y2="60"/></g></g>`
    ),
    "tv": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="18" y="26" width="64" height="40" rx="3"/>` +
        `<g stroke-width="2.5">` +
        `<line x1="50" y1="66" x2="50" y2="74"/>` +
        `<line x1="38" y1="74" x2="62" y2="74"/></g></g>`
    ),
    "desk": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="18" y="32" width="64" height="16" rx="2"/>` +
        `<g stroke-width="2.5">` +
        `<line x1="24" y1="48" x2="24" y2="66"/>` +
        `<line x1="76" y1="48" x2="76" y2="66"/>` +
        `<circle cx="50" cy="70" r="10"/></g></g>`
    ),
    "wardrobe": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="26" y="16" width="48" height="68" rx="3"/>` +
        `<g stroke-width="2.5">` +
        `<line x1="50" y1="16" x2="50" y2="84"/>` +
        `<line x1="45" y1="46" x2="45" y2="56"/>` +
        `<line x1="55" y1="46" x2="55" y2="56"/></g></g>`
    ),
    "stairs": svg(
        `<g fill="none" stroke="currentColor" stroke-width="3">` +
        `<rect x="28" y="14" width="44" height="72"/>` +
        `<g stroke-width="2">` +
        `<line x1="28" y1="23" x2="72" y2="23"/><line x1="28" y1="32" x2="72" y2="32"/>` +
        `<line x1="28" y1="41" x2="72" y2="41"/><line x1="28" y1="50" x2="72" y2="50"/>` +
        `<line x1="28" y1="59" x2="72" y2="59"/><line x1="28" y1="68" x2="72" y2="68"/>` +
        `<line x1="28" y1="77" x2="72" y2="77"/></g>` +
        `<polyline points="44,32 50,24 56,32" stroke-width="2.5"/>` +
        `<line x1="50" y1="24" x2="50" y2="78" stroke-width="2.5"/></g>`
    ),
    "rug": svg(
        `<g fill="none" stroke="currentColor">` +
        `<rect x="18" y="26" width="64" height="48" rx="6" stroke-width="3"/>` +
        `<rect x="26" y="33" width="48" height="34" rx="4" stroke-width="1.5" stroke-dasharray="5 4"/></g>`
    ),
    "plant": svg(
        `<g fill="none" stroke="currentColor">` +
        `<path d="M42,58 L58,58 L54,80 L46,80 Z" stroke-width="3"/>` +
        `<circle cx="50" cy="40" r="12" stroke-width="2.5"/>` +
        `<circle cx="38" cy="48" r="9" stroke-width="2.5"/>` +
        `<circle cx="62" cy="48" r="9" stroke-width="2.5"/></g>`
    ),
};

const BUILT_IN_WALL_PATTERNS = {
    // Structural walls — single edges.
    "wall-top": wall("top"),
    "wall-right": wall("right"),
    "wall-bottom": wall("bottom"),
    "wall-left": wall("left"),

    // Corners (two adjacent edges).
    "wall-corner-tl": wall("top", "left"),
    "wall-corner-tr": wall("top", "right"),
    "wall-corner-br": wall("bottom", "right"),
    "wall-corner-bl": wall("bottom", "left"),

    // Corridors (two opposite edges).
    "wall-corridor-h": wall("left", "right"),
    "wall-corridor-v": wall("top", "bottom"),

    // T-junctions (three edges; named by the OPEN side).
    "wall-t-open-bottom": wall("top", "left", "right"),
    "wall-t-open-top": wall("bottom", "left", "right"),
    "wall-t-open-right": wall("top", "bottom", "left"),
    "wall-t-open-left": wall("top", "bottom", "right"),

    // All four edges — a closed room / cross.
    "wall-box": wall("top", "right", "bottom", "left"),

    // Door openings — the wall break only (the leaf lives in OBJECT_PATTERNS).
    "door-top": DOOR.top,
    "door-right": DOOR.right,
    "door-bottom": DOOR.bottom,
    "door-left": DOOR.left,

    // Windows.
    "window-top": WIN.top,
    "window-right": WIN.right,
    "window-bottom": WIN.bottom,
    "window-left": WIN.left,
};

// Object overlay patterns — a second layer above the wall. Door leaves (the
// swing) plus furniture / decor. Kept separate from walls so an object can sit
// on top of a wall in the same tile and take its own color.
// Door leaves — default plus `-alt` (hinge on the opposite jamb). Pair each with
// the matching WALL `door-<edge>` opening. Every leaf ships in two forms: the
// default sits at the inner wall face (`WT`), and `-edge` is flush with the tile
// boundary (inset `0`) for doors placed without a wall behind them.
const DOOR_LEAF_KEYS = [
    ["door-leaf-top", "top"],
    ["door-leaf-top-alt", "topAlt"],
    ["door-leaf-right", "right"],
    ["door-leaf-right-alt", "rightAlt"],
    ["door-leaf-bottom", "bottom"],
    ["door-leaf-bottom-alt", "bottomAlt"],
    ["door-leaf-left", "left"],
    ["door-leaf-left-alt", "leftAlt"],
];
const DOOR_LEAVES = {};
for (const [key, orient] of DOOR_LEAF_KEYS) {
    DOOR_LEAVES[key] = doorLeaf(orient, WT);            // inside the wall
    DOOR_LEAVES[`${key}-edge`] = doorLeaf(orient, 0);   // flush with the tile edge
}

const BUILT_IN_OBJECT_PATTERNS = {
    ...DOOR_LEAVES,

    // Furniture / decor.
    ...FURNITURE,
};

const BUILT_IN_BACKGROUND_PATTERNS = {
    // Crosshatch — an X in every 50-unit cell; lines connect across tiles.
    "diagonals": svg(
        `<g stroke="currentColor" stroke-width="1" stroke-linecap="round">` +
        [0, 50]
            .flatMap((ox) => [0, 50].map((oy) =>
                `<line x1="${ox}" y1="${oy}" x2="${ox + 50}" y2="${oy + 50}"/>` +
                `<line x1="${ox + 50}" y1="${oy}" x2="${ox}" y2="${oy + 50}"/>`
            ))
            .join("") +
        `</g>`
    ),

    // Single-direction diagonal hatch (parallel lines, spaced 25 apart).
    "hatch": svg(
        `<g stroke="currentColor" stroke-width="2" stroke-linecap="round">` +
        `<line x1="0" y1="25" x2="25" y2="0"/>` +
        `<line x1="0" y1="50" x2="50" y2="0"/>` +
        `<line x1="0" y1="75" x2="75" y2="0"/>` +
        `<line x1="0" y1="100" x2="100" y2="0"/>` +
        `<line x1="25" y1="100" x2="100" y2="25"/>` +
        `<line x1="50" y1="100" x2="100" y2="50"/>` +
        `<line x1="75" y1="100" x2="100" y2="75"/></g>`
    ),

    // Wood planks — horizontal boards (height 25) with staggered butt joints.
    "planks-h": svg(
        `<g stroke="currentColor" stroke-width="2">` +
        [0, 25, 50, 75, 100].map((y) => `<line x1="0" y1="${y}" x2="100" y2="${y}"/>`).join("") +
        `<line x1="50" y1="0" x2="50" y2="25"/><line x1="50" y1="50" x2="50" y2="75"/>` +
        `<line x1="0" y1="25" x2="0" y2="50"/><line x1="100" y1="25" x2="100" y2="50"/>` +
        `<line x1="0" y1="75" x2="0" y2="100"/><line x1="100" y1="75" x2="100" y2="100"/></g>`
    ),

    // Wood planks — vertical boards (width 25) with staggered butt joints.
    "planks-v": svg(
        `<g stroke="currentColor" stroke-width="2">` +
        [0, 25, 50, 75, 100].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="100"/>`).join("") +
        `<line x1="0" y1="50" x2="25" y2="50"/><line x1="50" y1="50" x2="75" y2="50"/>` +
        `<line x1="25" y1="0" x2="50" y2="0"/><line x1="25" y1="100" x2="50" y2="100"/>` +
        `<line x1="75" y1="0" x2="100" y2="0"/><line x1="75" y1="100" x2="100" y2="100"/></g>`
    ),

    // Parquet basket-weave — 4×4 blocks (25) with alternating grain.
    "parquet": svg((() => {
        const grid = [0, 25, 50, 75, 100];
        let s = `<g stroke="currentColor" stroke-width="1.5" fill="none">`;
        grid.forEach((v) => {
            s += `<line x1="${v}" y1="0" x2="${v}" y2="100"/><line x1="0" y1="${v}" x2="100" y2="${v}"/>`;
        });
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const bx = i * 25, by = j * 25;
                if ((i + j) % 2 === 0) {
                    s += `<line x1="${bx + 4}" y1="${by + 8}" x2="${bx + 21}" y2="${by + 8}"/>` +
                         `<line x1="${bx + 4}" y1="${by + 17}" x2="${bx + 21}" y2="${by + 17}"/>`;
                } else {
                    s += `<line x1="${bx + 8}" y1="${by + 4}" x2="${bx + 8}" y2="${by + 21}"/>` +
                         `<line x1="${bx + 17}" y1="${by + 4}" x2="${bx + 17}" y2="${by + 21}"/>`;
                }
            }
        }
        return s + `</g>`;
    })()),

    // Large square tiles (25-unit grid).
    "tiles-large": svg(
        `<g stroke="currentColor" stroke-width="2">` +
        [0, 25, 50, 75, 100]
            .map((v) => `<line x1="${v}" y1="0" x2="${v}" y2="100"/><line x1="0" y1="${v}" x2="100" y2="${v}"/>`)
            .join("") +
        `</g>`
    ),

    // Small square tiles (12.5-unit grid).
    "tiles-small": svg(
        `<g stroke="currentColor" stroke-width="1.2">` +
        [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100]
            .map((v) => `<line x1="${v}" y1="0" x2="${v}" y2="100"/><line x1="0" y1="${v}" x2="100" y2="${v}"/>`)
            .join("") +
        `</g>`
    ),

    // Checkerboard — 4×4 cells; alternates seamlessly across tiles.
    "checkerboard": svg(
        `<g fill="currentColor">` +
        [0, 1, 2, 3]
            .flatMap((i) => [0, 1, 2, 3].filter((j) => (i + j) % 2 === 0)
                .map((j) => `<rect x="${i * 25}" y="${j * 25}" width="25" height="25"/>`))
            .join("") +
        `</g>`
    ),

    // Brick running bond — bricks 25×12.5, head joints offset per course.
    "bricks": svg((() => {
        let s = `<g stroke="currentColor" stroke-width="1.2">`;
        for (let k = 0; k <= 8; k++) {
            const y = k * 12.5;
            s += `<line x1="0" y1="${y}" x2="100" y2="${y}"/>`;
        }
        for (let r = 0; r < 8; r++) {
            const y0 = r * 12.5, y1 = y0 + 12.5;
            const offset = r % 2 === 0 ? 0 : 12.5;
            for (let x = offset; x <= 100; x += 25) {
                s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
            }
        }
        return s + `</g>`;
    })()),

    // Fine carpet dot texture (10-unit grid, inset so it tiles seamlessly).
    "carpet": svg(
        `<g fill="currentColor">` +
        [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
            .flatMap((x) => [5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((y) => `<circle cx="${x}" cy="${y}" r="1.3"/>`))
            .join("") +
        `</g>`
    ),

    // Pebbles / gravel (circles on the 25-grid; edge circles join up).
    "pebbles": svg(
        `<g fill="none" stroke="currentColor" stroke-width="1.5">` +
        [0, 25, 50, 75, 100]
            .flatMap((x) => [0, 25, 50, 75, 100].map((y) => `<circle cx="${x}" cy="${y}" r="7"/>`))
            .join("") +
        `</g>`
    ),

    // Water — wavy lines that connect at the left/right edges. Each row is a
    // half-wave (q) followed by 7 smooth reflections (t), 12.5 wide each: one q
    // + seven t = 8 * 12.5 = a full span from x=0 to x=100 (reaches both edges).
    "water": svg(
        `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">` +
        [6.25, 18.75, 31.25, 43.75, 56.25, 68.75, 81.25, 93.75]
            .map((y) => `<path d="M0,${y} q6.25,-4 12.5,0${" t12.5,0".repeat(7)}"/>`)
            .join("") +
        `</g>`
    ),

    // Grass — 16 tufts on a jittered lattice with varied heights so the
    // repeat is not obvious; tufts stay inside the tile so it still tiles.
    "grass": svg(
        `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">` +
        [
            [15.5, 18.5, 13], [32.5, 14.5, 11], [68.5, 9.5, 15], [83.5, 17.5, 12],
            [9.5, 33.5, 14], [42.5, 43.5, 10], [56.5, 35.5, 13], [90.5, 41.5, 12],
            [16.5, 65.5, 11], [32.5, 57.5, 15], [68.5, 66.5, 12], [84.5, 59.5, 14],
            [8.5, 90.5, 13], [42.5, 83.5, 11], [56.5, 89.5, 15], [91.5, 82.5, 12],
        ]
            .map(([x, y, h]) => {
                const side = (h * 0.7).toFixed(1);
                return `<path d="M${x},${y} L${x - 4},${y - side} M${x},${y} L${x},${y - h} M${x},${y} L${x + 4},${y - side}"/>`;
            })
            .join("") +
        `</g>`
    ),
};

// Live pattern registries consumed across the UI. They start as copies of the
// built-ins and may be extended (or individual keys overridden) by an optional
// user file — see patternsReady below. These object references are STABLE: the
// loader mutates them in place via Object.assign, so every module that imported
// them keeps seeing the merged result without re-importing.
export const BACKGROUND_PATTERNS = { ...BUILT_IN_BACKGROUND_PATTERNS };
export const WALL_PATTERNS = { ...BUILT_IN_WALL_PATTERNS };
export const OBJECT_PATTERNS = { ...BUILT_IN_OBJECT_PATTERNS };

// Optional user overrides live OUTSIDE this package folder so that replacing
// the whole `floor-plan-easy/` directory on update never touches them. Home
// Assistant serves `config/www/` at `/local/`, so the file the user creates is
// `config/www/floor-plan-easy-user-patterns.js` (see README → Custom patterns).
const USER_PATTERNS_URL = "/local/floor-plan-easy-user-patterns.js";

// Resolves once the optional user pattern file has been merged in (or has been
// determined to be absent). Await this before READING the registries when the
// merged result must be complete — e.g. before building a pattern picker. It
// never rejects: a missing user file is the normal case.
export const patternsReady = (async () => {
    // Probe first so we can tell the two cases apart: a dynamic import() failure
    // alone cannot distinguish "file absent" (the normal case) from "file exists
    // but is broken" (a user mistake worth surfacing).
    let exists = false;
    try {
        const res = await fetch(USER_PATTERNS_URL, { method: "HEAD" });
        exists = res.ok;
    } catch (e) {
        // Network error reaching the server — treat as absent.
    }

    if (!exists) {
        // Expected when the user has not created the optional file.
        console.info(`floor_plan_easy: no user pattern file at ${USER_PATTERNS_URL} (optional).`);
        return;
    }

    let mod;
    try {
        mod = await import(USER_PATTERNS_URL);
    } catch (e) {
        // The file is present but failed to load/parse — surface it so the user
        // can fix the syntax error instead of silently getting no patterns.
        console.warn(`floor_plan_easy: user pattern file at ${USER_PATTERNS_URL} exists but could not be loaded — check it for syntax errors.`, e);
        return;
    }
    try {
        if (mod.BACKGROUND_PATTERNS) Object.assign(BACKGROUND_PATTERNS, mod.BACKGROUND_PATTERNS);
        if (mod.WALL_PATTERNS) Object.assign(WALL_PATTERNS, mod.WALL_PATTERNS);
        if (mod.OBJECT_PATTERNS) Object.assign(OBJECT_PATTERNS, mod.OBJECT_PATTERNS);
    } catch (e) {
        console.warn("floor_plan_easy: failed to merge user patterns", e);
    }
})();
