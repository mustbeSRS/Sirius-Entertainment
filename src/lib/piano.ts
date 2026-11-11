import { intervals, type Chord } from "./music";
export class GrandPiano {
  private context: AudioContext | null = null;
  private buffers = new Map<number, AudioBuffer>();
  private voices: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  private generation = 0;
  get generationId() {
    return this.generation;
  }
  async prepare() {
    if (!this.context) this.context = new AudioContext();
    await this.context.resume();
    if (this.buffers.size === 7) return;
    const context = this.context;
    await Promise.all(
      [1, 2, 3, 4, 5, 6, 7].map(async (octave) => {
        const midi = (octave + 1) * 12;
        if (this.buffers.has(midi)) return;
        const response = await fetch(`/audio/piano/C${octave}.mp3`);
        if (!response.ok)
          throw Error("Piano samples could not be loaded. Please retry.");
        this.buffers.set(
          midi,
          await context.decodeAudioData(await response.arrayBuffer()),
        );
      }),
    );
  }
  play(chord: Chord, duration = 3, volume = 0.65, pedal = false) {
    if (!this.context || this.buffers.size !== 7)
      throw Error("Load the grand piano first.");
    const context = this.context;
    const time = context.currentTime;
    const midis = intervals[chord.quality].map((n) => 48 + chord.root + n);
    midis.unshift(36 + chord.root);
    for (const [i, midi] of midis.entries()) {
      const root = [...this.buffers.keys()].sort(
        (a, b) => Math.abs(a - midi) - Math.abs(b - midi),
      )[0];
      const source = context.createBufferSource(),
        gain = context.createGain();
      source.buffer = this.buffers.get(root)!;
      source.playbackRate.value = 2 ** ((midi - root) / 12);
      const start = time + i * 0.018;
      const hold = pedal
        ? Math.min(10, source.buffer.duration / source.playbackRate.value - 0.5)
        : duration;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        (volume / Math.sqrt(midis.length)) * 0.7,
        start + 0.012,
      );
      gain.gain.setTargetAtTime(0.0001, start + hold, 0.3);
      source.connect(gain);
      gain.connect(context.destination);
      source.start(start);
      source.stop(
        Math.min(
          start + hold + 2,
          start + source.buffer.duration / source.playbackRate.value,
        ),
      );
      const voice = { source, gain };
      this.voices.push(voice);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        this.voices = this.voices.filter((v) => v !== voice);
      };
    }
  }
  stop() {
    this.generation++;
    if (!this.context) return;
    for (const v of this.voices) {
      try {
        v.gain.gain.cancelScheduledValues(this.context.currentTime);
        v.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.035);
        v.source.stop(this.context.currentTime + 0.15);
      } catch {}
    }
    this.voices = [];
  }
  async sequence(
    chords: Chord[],
    bpm: number,
    sustain: number,
    volume: number,
    pedal: boolean,
    onChord: (i: number) => void,
  ) {
    this.stop();
    const generation = this.generation;
    await this.prepare();
    for (let i = 0; i < chords.length; i++) {
      if (generation !== this.generation) return;
      onChord(i);
      this.play(chords[i], sustain, volume, pedal);
      await new Promise((resolve) => setTimeout(resolve, 240000 / bpm));
    }
    if (generation === this.generation) onChord(-1);
  }
  dispose() {
    this.stop();
    void this.context?.close();
  }
}
