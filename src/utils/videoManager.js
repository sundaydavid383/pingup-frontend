export const videoManager = new EventTarget();

export const videoState = {
  activeVideo: null,   // the ONLY allowed video
  userHasUnmuted: false,
};
