// Opens the "Busy" dialog of the header's busy button from elsewhere (e.g.
// the middleman screen).
export const OPEN_BUSY_DIALOG_EVENT = "open-busy-dialog";

export const openBusyDialog = () =>
  window.dispatchEvent(new Event(OPEN_BUSY_DIALOG_EVENT));
