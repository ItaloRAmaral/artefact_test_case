// jsdom 31 has no showModal or close on <dialog>; the fake only toggles `open`, so tests
// check what a component asks of the dialog. The real top layer is covered by e2e.
export function installDialogFake(): void {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  };

  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}
