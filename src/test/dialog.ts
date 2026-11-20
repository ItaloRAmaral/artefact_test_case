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
