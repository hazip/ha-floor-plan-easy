import { FloorPlanEasyCard } from "./ui/card.js";
customElements.define("floor-plan-easy", FloorPlanEasyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "floor-plan-easy",
  name: "Floor Plan Easy",
  description: "Floor plan card"
});

import { FloorPlanEasyConfig } from "./ui/config.js";
customElements.define("floor-plan-easy-config", FloorPlanEasyConfig);

import { FloorPlanEasyEditor } from "./ui/editor.js";
customElements.define("floor-plan-easy-editor", FloorPlanEasyEditor);
