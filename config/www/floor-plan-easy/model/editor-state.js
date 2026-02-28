export const EditorMode = {
  BACKGROUND_SET: "background_set",
  BACKGROUND_CLEAR: "background_clear",
  WALL_SET: "wall_set",
  WALL_CLEAR: "wall_clear",
  CONTENT_EDIT: "content_edit",
  CONTENT_CLEAR: "content_clear",
};

export class EditorState {
  constructor() {
    this.activeMode = EditorMode.BACKGROUND_SET;

    this.bg = {
      fgColor: "#ffffff",
      bgColor: "#ff0000",
      patternKey: "",
    };

    this.wall = {
      fgColor: "#ffffff",
      patternKey: "corner1"
    }

    this.contentTemplate = {
      entity: "",
      icon: "",
      tapAction: "none",
    };
  }
}
