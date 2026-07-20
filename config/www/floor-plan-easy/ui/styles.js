const STYLE_ID = "floor-plan-easy-styles";

export function ensureStyles(hostEl) {
  const root = hostEl?.getRootNode?.();
  const target = root instanceof ShadowRoot ? root : document.head;

  if (target.querySelector?.(`#${STYLE_ID}`)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    /* GRID */

    .floor-grid {
      display: grid;
      gap: 0px;
      width: 100%;
    }

    .tile {
      aspect-ratio: 1 / 1;
      box-sizing: border-box;
      position: relative;
      z-index: 0;
      border: 0px;
      overflow: hidden;
      min-width: 0;
      min-height: 0;
    }

    .tile.editor {
      border: 1px solid gray;
    }

    .tile.editor:hover {
      border: 1px solid white;
    }

    .tile-wall {
      position: absolute;
      inset: 0;
      z-index: 5;
      pointer-events: none;
      background-repeat: no-repeat;
      background-position: center;
      /* 100% 100% (not contain): fill the square tile exactly so the motif
         reaches every edge regardless of the SVG's intrinsic size. */
      background-size: 100% 100%;
    }

    .tile-object {
      position: absolute;
      inset: 0;
      z-index: 7;
      pointer-events: none;
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100% 100%;
    }

    .tile-content {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* clickable icon button */
    .tile-icon-btn {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 70%;
      height: 70%;
      border-radius: 10px;
    }

    .tile-icon-btn:hover {
      background: rgba(0,0,0,0.06);
    }

    /* badge */
    .tile-badge {
      font-size: 12px;
      line-height: 1.2;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(0,0,0,0.08);
      color: var(--primary-text-color);
      max-width: 90%;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* TOOLBAR */

    .editor-toolbar{
      display:flex;
      align-items:center;
      gap:12px;
      padding:8px;
      border-bottom:1px solid var(--divider-color);
    }

    .tool-section{
      display:flex;
      align-items:center;
      gap:8px;
    }

    .tool-separator{
      width:1px;
      height:28px;
      background: var(--divider-color);
    }

    .tool-group{
      display:inline-flex;
      align-items:stretch;
    }

    .tool-btn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:36px;
      height:36px;
      border:1px solid rgba(0,0,0,0.18);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border-radius:10px;
      cursor:pointer;
      padding:0;
    }

    .tool-btn ha-icon{
      --mdc-icon-size: 20px;
    }

    .tool-group.split .tool-btn{
      border-radius:0;
    }

    .tool-group.split .tool-btn:first-child{
      border-top-left-radius:10px;
      border-bottom-left-radius:10px;
    }

    .tool-group.split .tool-btn:last-child{
      border-top-right-radius:10px;
      border-bottom-right-radius:10px;
      border-left:none;
      width:28px;
    }

    .tool-btn.active{
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 25%, transparent);
    }

    .tool-btn.danger{
      color: var(--error-color);
    }

    .tool-btn:active{
      transform: translateY(1px);
    }

    .tool-btn.tool-plain{
      width: auto;
      padding: 0 12px;
      font-weight: 600;
      font-size: 13px;
    }

    /* TOOLBAR DROPDOWN */

    .tool-dropdown{
      position: relative;
      display: inline-flex;
    }

    .tool-dropdown-menu{
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 220px;
      padding: 6px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 12px rgba(0,0,0,0.25));
    }

    .tool-dropdown-menu[hidden]{
      display: none;
    }

    .tool-dropdown-item{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: none;
      background: transparent;
      color: var(--primary-text-color);
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      text-align: left;
      white-space: nowrap;
    }

    .tool-dropdown-item:hover{
      background: rgba(0,0,0,0.06);
    }

    .tool-dropdown-item ha-icon{
      --mdc-icon-size: 20px;
    }

    .fp-pattern-grid{
      display: grid;
      grid-template-columns: repeat(auto-fill, 56px);
      gap: 10px;
      justify-content: start;
    }

    /* Section heading above each group of pattern tiles. */
    .fp-pattern-group-label{
      font-size: 12px;
      font-weight: 600;
      opacity: 0.7;
      margin-top: 4px;
    }

    .fp-pattern-tile{
      width: 56px;
      height: 56px;
      border-radius: 0;
      border: 1px solid rgba(0,0,0,0.18);
      background: rgba(250,250,250,0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      user-select: none;
    }

    .fp-pattern-tile-none{
      background: rgba(0,0,0,0.03);
    }

    .fp-pattern-tile:hover{
      background: rgba(250,250,250,0.5);
    }

    .fp-pattern-tile.active{
      border: 3px solid var(--primary-color);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 40%, transparent);
    }

    .fp-pattern-preview{
      width: 40px;               /* fixed px, not % */
      height: 40px;              /* fixed px, not % */
      border-radius: 0;
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100% 100%;   /* fill the square preview, reach all edges */
      color: var(--primary-text-color);
      pointer-events: none;      /* the tile receives the click */
      display:flex;              /* keep the "—" centered too */
      align-items:center;
      justify-content:center;
    }

    /* Saved-color palette (swatches) under each color picker. */
    .fp-color-field{
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Reuses .tool-btn for the button chrome; only the compact size differs. */
    .fp-swatch-save{
      width: 28px;
      height: 28px;
      flex: 0 0 auto;
      font-size: 18px;
      line-height: 1;
    }

    .fp-swatch-strip{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-left: 122px;   /* align under the input, past the 110px label + gap */
    }

    .fp-swatch{
      position: relative;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid var(--divider-color, rgba(0,0,0,0.25));
      border-radius: 6px;
      cursor: pointer;
    }

    .fp-swatch-remove{
      position: absolute;
      top: -6px;
      right: -6px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      border: 1px solid rgba(0,0,0,0.3);
      color: var(--primary-text-color);
      font-size: 11px;
      line-height: 12px;
      text-align: center;
      display: none;
    }

    .fp-swatch:hover .fp-swatch-remove{
      display: block;
    }

    /* MODAL — currently unused (dialogs use <ha-dialog>); kept for reference. */

    .fp-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fp-modal {
      position: fixed;
      top: calc(50% - 200px);
      left: calc(50% - 210px);
      width: 420px;
      background: var(--card-background-color, white);
      padding: 16px;
      border-radius: 12px;
      box-shadow: var(--ha-card-box-shadow);
      overflow: visible;
    }

    .fp-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 12px;
    }

    .fp-modal .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }

  `;

  target.appendChild(style);
}
