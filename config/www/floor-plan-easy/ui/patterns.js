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

// ── Wall openings (WALL layer) ───────────────────────────────────────────────
// A wall break on one edge: two stubs leaving a central gap. Two widths — narrow
// (stub 30, gap 30..70) can pair with a door leaf; wide (stub 15, gap 15..85)
// suits a window pane. Each opening also ships two variants that additionally
// draw ONE of the two walls perpendicular to the opening's edge, so an opening
// can sit in a tile where two walls meet (a corner carrying a door/window).
const OPENING_STUB = { narrow: 30, wide: 15 };   // stub length per width

// Clear gap between the two stubs, derived from the stub length: [stub, 100-stub]
// (narrow -> 30..70, wide -> 15..85). Single source of truth for the opening
// widths — door leaves and window panes size themselves from this so a change to
// OPENING_STUB flows through everywhere.
const OPENING_GAPS = Object.fromEntries(
    Object.entries(OPENING_STUB).map(([width, stub]) => [width, [stub, 100 - stub]])
);

// The two wall stubs of an opening on `edge`, each `stub` long (fill only).
const openingStubs = (edge, stub) => {
    switch (edge) {
        case "top":    return `<rect x="0" y="0" width="${stub}" height="${WT}" fill="currentColor"/><rect x="${100 - stub}" y="0" width="${stub}" height="${WT}" fill="currentColor"/>`;
        case "bottom": return `<rect x="0" y="${100 - WT}" width="${stub}" height="${WT}" fill="currentColor"/><rect x="${100 - stub}" y="${100 - WT}" width="${stub}" height="${WT}" fill="currentColor"/>`;
        case "left":   return `<rect x="0" y="0" width="${WT}" height="${stub}" fill="currentColor"/><rect x="0" y="${100 - stub}" width="${WT}" height="${stub}" fill="currentColor"/>`;
        case "right":  return `<rect x="${100 - WT}" y="0" width="${WT}" height="${stub}" fill="currentColor"/><rect x="${100 - WT}" y="${100 - stub}" width="${WT}" height="${stub}" fill="currentColor"/>`;
    }
};

// The two edges perpendicular to an opening's edge (the walls at its two ends).
const PERP_EDGES = {
    top: ["left", "right"],
    bottom: ["left", "right"],
    left: ["top", "bottom"],
    right: ["top", "bottom"],
};

const WALL_OPENINGS = {};
for (const edge of ["top", "right", "bottom", "left"]) {
    for (const [width, stub] of Object.entries(OPENING_STUB)) {
        const stubs = openingStubs(edge, stub);
        WALL_OPENINGS[`opening-${width}-${edge}`] = svg(stubs);
        for (const perp of PERP_EDGES[edge]) {
            // Same opening plus one perpendicular wall drawn in full.
            WALL_OPENINGS[`opening-${width}-${edge}-wall-${perp}`] = svg(stubs + EDGE[perp]);
        }
    }
}

// ── Door leaves (OBJECT layer) ───────────────────────────────────────────────
// The swinging panel + its arc, bulging INTO the tile (the room). NO wall stub —
// the opening is drawn separately in the WALL layer. Each edge has two variants:
// the default (hinge on the first jamb) and `*Alt` (hinge on the opposite jamb —
// the door opens the other way). Geometry matches the wall openings above so a
// leaf lines up inside its opening's gap.
//
// The hinge sits `inset` units from the near edge — `WT` so the leaf starts at
// the inner face of the wall, or `0` for the edge-aligned variant flush with the
// tile boundary. `a`/`b` are the two jamb coordinates the leaf spans; the panel
// (and swing radius) is `b - a` long, so the same drawing serves both opening
// sizes — narrow (30..70) and the longer wide fit (15..85). The panel line is
// drawn thicker than the arc so the door itself reads clearly; the arc keeps its
// thin sweep.
const LEAF_W = 5;      // panel stroke (the door itself — bold)
const ARC_W = 1.2;     // swing-arc stroke (thin sweep)

// Panel line + swing arc for one orientation, given the hinge inset `i` and the
// jamb coordinates `a`/`b` (the leaf spans a..b; the swing radius is L = b - a).
const DOOR_LEAF_BODY = {
    top:       (i, a, b) => { const L = b - a; return `<line x1="${a}" y1="${i}" x2="${a}" y2="${i + L}" stroke-width="${LEAF_W}"/><path d="M${a},${i + L} A${L},${L} 0 0 0 ${b},${i}" stroke-width="${ARC_W}"/>`; },
    topAlt:    (i, a, b) => { const L = b - a; return `<line x1="${b}" y1="${i}" x2="${b}" y2="${i + L}" stroke-width="${LEAF_W}"/><path d="M${b},${i + L} A${L},${L} 0 0 1 ${a},${i}" stroke-width="${ARC_W}"/>`; },
    bottom:    (i, a, b) => { const L = b - a; return `<line x1="${a}" y1="${100 - i}" x2="${a}" y2="${100 - i - L}" stroke-width="${LEAF_W}"/><path d="M${a},${100 - i - L} A${L},${L} 0 0 1 ${b},${100 - i}" stroke-width="${ARC_W}"/>`; },
    bottomAlt: (i, a, b) => { const L = b - a; return `<line x1="${b}" y1="${100 - i}" x2="${b}" y2="${100 - i - L}" stroke-width="${LEAF_W}"/><path d="M${b},${100 - i - L} A${L},${L} 0 0 0 ${a},${100 - i}" stroke-width="${ARC_W}"/>`; },
    left:      (i, a, b) => { const L = b - a; return `<line x1="${i}" y1="${a}" x2="${i + L}" y2="${a}" stroke-width="${LEAF_W}"/><path d="M${i + L},${a} A${L},${L} 0 0 1 ${i},${b}" stroke-width="${ARC_W}"/>`; },
    leftAlt:   (i, a, b) => { const L = b - a; return `<line x1="${i}" y1="${b}" x2="${i + L}" y2="${b}" stroke-width="${LEAF_W}"/><path d="M${i + L},${b} A${L},${L} 0 0 0 ${i},${a}" stroke-width="${ARC_W}"/>`; },
    right:     (i, a, b) => { const L = b - a; return `<line x1="${100 - i}" y1="${a}" x2="${100 - i - L}" y2="${a}" stroke-width="${LEAF_W}"/><path d="M${100 - i - L},${a} A${L},${L} 0 0 0 ${100 - i},${b}" stroke-width="${ARC_W}"/>`; },
    rightAlt:  (i, a, b) => { const L = b - a; return `<line x1="${100 - i}" y1="${b}" x2="${100 - i - L}" y2="${b}" stroke-width="${LEAF_W}"/><path d="M${100 - i - L},${b} A${L},${L} 0 0 1 ${100 - i},${a}" stroke-width="${ARC_W}"/>`; },
};

const doorLeaf = (orient, inset, a, b) =>
    svg(`<g fill="none" stroke="currentColor">${DOOR_LEAF_BODY[orient](inset, a, b)}</g>`);
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

// ── Stairs (OBJECT layer) ────────────────────────────────────────────────────
// Its own group in the object picker (only one for now, more may follow).
const STAIRS = {
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

    // Openings — narrow / wide, each plain and with one perpendicular wall.
    ...WALL_OPENINGS,
};

// Object overlay patterns — a second layer above the wall. Door leaves (the
// swing) plus furniture / decor. Kept separate from walls so an object can sit
// on top of a wall in the same tile and take its own color.
// Door leaves — default plus `-alt` (hinge on the opposite jamb). Pair each with
// the matching WALL `opening-narrow-<edge>` (or the `-long` leaf with an
// `opening-wide-<edge>`). Every leaf ships in two forms: the default sits at the
// inner wall face (`WT`), and `-edge` is flush with the tile boundary (inset `0`)
// for doors placed without a wall behind them.
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
// Leaf sizes span the opening gaps (see OPENING_GAPS): the default fits the
// narrow opening, `-long` the wide one. Every orientation ships in both sizes,
// each in the inner (inset WT) and `-edge` (inset 0, flush) forms.
const LEAF_SIZES = {
    "": OPENING_GAPS.narrow,       // narrow opening
    "-long": OPENING_GAPS.wide,    // wide opening
};
const DOOR_LEAVES = {};
for (const [key, orient] of DOOR_LEAF_KEYS) {
    for (const [sizeSuffix, [a, b]] of Object.entries(LEAF_SIZES)) {
        DOOR_LEAVES[`${key}${sizeSuffix}`] = doorLeaf(orient, WT, a, b);        // inside the wall
        DOOR_LEAVES[`${key}${sizeSuffix}-edge`] = doorLeaf(orient, 0, a, b);    // flush with the tile edge
    }
}

// ── Window panes (OBJECT layer) ──────────────────────────────────────────────
// The glass + frame that fills a wall opening's clear gap, drawn above the wall
// so it can be dropped onto an opening in the same tile. Each pane spans the gap
// [a,b] of one opening type — NARROW (30..70) or WIDE (15..85) — and sits inside
// the wall band (thickness WT) on the given edge. Same glass drawing the old
// built-in windows used (a thin frame with a center glazing bar).
const WINDOW_PANE_BODY = {
    top:    (a, b) => `<rect x="${a}" y="3" width="${b - a}" height="6"/><line x1="${a}" y1="6" x2="${b}" y2="6"/>`,
    bottom: (a, b) => `<rect x="${a}" y="91" width="${b - a}" height="6"/><line x1="${a}" y1="94" x2="${b}" y2="94"/>`,
    left:   (a, b) => `<rect x="3" y="${a}" width="6" height="${b - a}"/><line x1="6" y1="${a}" x2="6" y2="${b}"/>`,
    right:  (a, b) => `<rect x="91" y="${a}" width="6" height="${b - a}"/><line x1="94" y1="${a}" x2="94" y2="${b}"/>`,
};
const windowPane = (edge, a, b) =>
    svg(`<g fill="none" stroke="currentColor" stroke-width="2">${WINDOW_PANE_BODY[edge](a, b)}</g>`);

// Each pane spans an opening's clear gap (see OPENING_GAPS), so panes stay
// aligned with the wall openings automatically.
const WINDOW_PANES = {};
for (const edge of ["top", "right", "bottom", "left"]) {
    for (const [width, [a, b]] of Object.entries(OPENING_GAPS)) {
        WINDOW_PANES[`window-${width}-${edge}`] = windowPane(edge, a, b);
    }
}

const BUILT_IN_OBJECT_PATTERNS = {
    ...DOOR_LEAVES,

    // Window panes.
    ...WINDOW_PANES,

    // Furniture / decor.
    ...FURNITURE,

    // Stairs.
    ...STAIRS,
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

// Picker groups. Each registry has an ordered list of groups; the settings
// dialog renders one labeled section per group, in this order, containing the
// listed keys (in listed order). `labelKey` is an i18n key (see ui/i18n).
// Any registry key not named by a group — e.g. a user-added pattern — is shown
// in a trailing "Other" section, so grouping is additive and never hides a key.
export const BACKGROUND_PATTERN_GROUPS = [
    { id: "indoor", labelKey: "group.bg.indoor", keys: [
        "diagonals", "hatch", "planks-h", "planks-v", "parquet",
        "tiles-large", "tiles-small", "checkerboard", "carpet",
    ] },
    { id: "outdoor", labelKey: "group.bg.outdoor", keys: [
        "bricks", "pebbles", "water", "grass",
    ] },
];

export const WALL_PATTERN_GROUPS = [
    { id: "wall", labelKey: "group.wall.wall", keys: [
        "wall-top", "wall-right", "wall-bottom", "wall-left",
        "wall-corner-tl", "wall-corner-tr", "wall-corner-br", "wall-corner-bl",
        "wall-corridor-h", "wall-corridor-v",
        "wall-t-open-bottom", "wall-t-open-top", "wall-t-open-right", "wall-t-open-left",
        "wall-box",
    ] },
    { id: "opening", labelKey: "group.wall.opening", keys: Object.keys(WALL_OPENINGS) },
];

export const OBJECT_PATTERN_GROUPS = [
    // Door leaves split by placement: the default variants sit at the inner wall
    // face ("inside the wall"); the `-edge` variants are flush with the tile
    // boundary, for doors with no wall behind them ("outside the wall").
    { id: "doors-inner", labelKey: "group.object.doors_inner", keys: Object.keys(DOOR_LEAVES).filter((k) => !k.endsWith("-edge")) },
    { id: "doors-outer", labelKey: "group.object.doors_outer", keys: Object.keys(DOOR_LEAVES).filter((k) => k.endsWith("-edge")) },
    { id: "windows", labelKey: "group.object.windows", keys: Object.keys(WINDOW_PANES) },
    { id: "furniture", labelKey: "group.object.furniture", keys: Object.keys(FURNITURE) },
    { id: "stairs", labelKey: "group.object.stairs", keys: Object.keys(STAIRS) },
];

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
