class MicRecorder extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button id="rec" style="padding:10px 18px;font-size:16px;border:none;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer;">🎤 Start</button>
      <span id="status" style="margin-left:10px;font-size:13px;color:#666;"></span>
    `;
    this.btn = this.querySelector('#rec');
    this.statusEl = this.querySelector('#status');
    this.btn.addEventListener('click', () => this.toggle());
  }

  async toggle() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop();
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      this.statusEl.textContent = 'Mic error: ' + err.name;
      this.dispatchEvent(new CustomEvent('mic-error', { detail: err.name }));
      return;
    }

    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };

    this.recorder.onstop = () => {
      this.stream.getTracks().forEach(t => t.stop());
      this.btn.textContent = '🎤 Start';
      this.btn.style.background = '#3b82f6';
      this.statusEl.textContent = 'Processing...';

      const blob = new Blob(this.chunks, { type: this.recorder.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        this.dispatchEvent(new CustomEvent('audio-ready', { detail: reader.result }));
        this.statusEl.textContent = 'Sent';
      };
      reader.readAsDataURL(blob);
    };

    this.recorder.start();
    this.btn.textContent = '⏹ Stop';
    this.btn.style.background = '#ef4444';
    this.statusEl.textContent = 'Recording...';
  }
}

customElements.define('mic-recorder', MicRecorder);