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
      background-size: contain;
    }

    .tile-content {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* kattintható ikon gomb */
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

    .fp-pattern-grid{
      display: grid;
      grid-template-columns: repeat(auto-fill, 56px);
      gap: 10px;
      justify-content: start;
    }

    .fp-pattern-tile{
      width: 56px;
      height: 56px;
      border-radius: 12px;
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
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 25%, transparent);
    }

    .fp-pattern-preview{
      width: 40px;               /* ✅ ne %-ot használjunk */
      height: 40px;              /* ✅ ne %-ot használjunk */
      border-radius: 8px;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      color: var(--primary-text-color);
      pointer-events: none;      /* a tile kapja a clicket */
      display:flex;              /* hogy a "—" is középen legyen */
      align-items:center;
      justify-content:center;
    }

    /* MODAL */

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
