const state = { anyOpen: false };

export function isAnyMarketingPopupOpen() {
  return state.anyOpen;
}

export function setMarketingPopupOpen(open: boolean) {
  state.anyOpen = open;
}
