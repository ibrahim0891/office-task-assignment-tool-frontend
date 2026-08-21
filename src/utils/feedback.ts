// Luxury tactile audio engine with warm, cushioned acoustic profiles (zero harshness)

type FeedbackSoundType = "click" | "pickup" | "drop" | "complete" | "toggle" | "delete" | "dial" | "switch";

let audioCtx: AudioContext | null = null;
const bufferCache: Partial<Record<FeedbackSoundType, AudioBuffer>> = {};

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

/**
 * Procedurally generates warm, luxurious acoustic buffers with Hann-windowed zero-crossing envelopes
 */
function createSoundBuffer(ctx: AudioContext, type: FeedbackSoundType): AudioBuffer {
    const sampleRate = ctx.sampleRate;

    switch (type) {
        case "dial": {
            // Ultra-subtle, warm mechanical micro-detent tick (6ms cushioned step)
            const duration = 0.007;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / length));
                // Soft 480Hz + 240Hz warm micro-tap (gentle on ears, zero harsh treble)
                const wave =
                    0.65 * Math.sin(2 * Math.PI * 480 * t) +
                    0.35 * Math.sin(2 * Math.PI * 240 * t);
                data[i] = wave * hann * 0.16;
            }
            return buffer;
        }

        case "pickup": {
            // Warm organic bubble/wooden pop (20ms damped marimba pop)
            const duration = 0.022;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const progress = i / length;
                const env = Math.exp(-progress * 6.5) * Math.sin(Math.PI * Math.min(1, progress * 3));
                const wave =
                    0.75 * Math.sin(2 * Math.PI * 440 * t) +
                    0.25 * Math.sin(2 * Math.PI * 880 * t);
                data[i] = wave * env * 0.45;
            }
            return buffer;
        }

        case "drop": {
            // Cushioned magnetic dock thud (48ms warm cushioned mechanical drop)
            const duration = 0.048;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const progress = i / length;
                // Soft initial attack followed by smooth exponential damping
                const attack = Math.min(1, progress * 8);
                const env = attack * Math.exp(-progress * 5.2);
                // Dual warm resonance: 140Hz body + 280Hz wooden snap rolling down to 80Hz
                const freq1 = 140 - progress * 50;
                const freq2 = 280 - progress * 120;
                const wave =
                    0.65 * Math.sin(2 * Math.PI * freq1 * t) +
                    0.35 * Math.sin(2 * Math.PI * freq2 * t);
                data[i] = wave * env * 0.5;
            }
            return buffer;
        }

        case "click": {
            // Muted mechanical keypress (12ms warm tactile snap)
            const duration = 0.014;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / length));
                const wave =
                    0.6 * Math.sin(2 * Math.PI * 820 * t) +
                    0.4 * Math.sin(2 * Math.PI * 410 * t);
                data[i] = wave * hann * 0.38;
            }
            return buffer;
        }

        case "toggle": {
            // Ultra-subtle, warm dual micro-detent click (distinct dual-tone, 38ms total)
            const duration = 0.038;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            const click1Len = Math.floor(sampleRate * 0.010);
            const gap = Math.floor(sampleRate * 0.016);
            const click2Start = click1Len + gap;
            const click2Len = length - click2Start;

            for (let i = 0; i < length; i++) {
                if (i < click1Len) {
                    const localT = i / sampleRate;
                    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / click1Len));
                    const wave =
                        0.7 * Math.sin(2 * Math.PI * 360 * localT) +
                        0.3 * Math.sin(2 * Math.PI * 180 * localT);
                    data[i] = wave * hann * 0.16;
                } else if (i >= click2Start) {
                    const localI = i - click2Start;
                    const localT = localI / sampleRate;
                    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * localI) / click2Len));
                    const wave =
                        0.7 * Math.sin(2 * Math.PI * 480 * localT) +
                        0.3 * Math.sin(2 * Math.PI * 240 * localT);
                    data[i] = wave * hann * 0.18;
                } else {
                    data[i] = 0;
                }
            }
            return buffer;
        }

        case "complete": {
            // Formal executive confirmation tone (subtle tactile stamp with warm 130ms acoustic dampening)
            const duration = 0.14;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const progress = i / length;
                const attack = Math.min(1, t / 0.005);
                const decay = Math.exp(-progress * 5.8);

                // Warm formal dual-resonance (D4 293.66Hz + A4 440Hz) with soft micro-transient
                const body =
                    0.65 * Math.sin(2 * Math.PI * 293.66 * t) +
                    0.35 * Math.sin(2 * Math.PI * 440 * t);
                const transient =
                    t < 0.01
                        ? 0.4 * Math.sin(2 * Math.PI * 680 * t) * (1 - t / 0.01)
                        : 0;

                data[i] = (body * decay + transient) * attack * 0.36;
            }
            return buffer;
        }

        case "delete": {
            // Soft muted wooden impact
            const duration = 0.03;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const progress = i / length;
                const env = Math.exp(-progress * 5.0) * Math.sin(Math.PI * Math.min(1, progress * 3));
                data[i] = Math.sin(2 * Math.PI * 120 * t) * env * 0.4;
            }
            return buffer;
        }

        case "switch": {
            // Modern Crystal Glass Chime (160ms luxurious cascading bell chime)
            const duration = 0.16;
            const length = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);

            const chime2Start = Math.floor(sampleRate * 0.035); // 35ms cascade

            for (let i = 0; i < length; i++) {
                let sample = 0;

                // Chime 1 (Warm crystal root: D5 587.33Hz + A5 880Hz + harmonic overtone)
                {
                    const t = i / sampleRate;
                    const progress = i / length;
                    const attack = Math.min(1, t / 0.004);
                    const decay = Math.exp(-progress * 6.8);
                    const wave =
                        0.55 * Math.sin(2 * Math.PI * 587.33 * t) +
                        0.30 * Math.sin(2 * Math.PI * 880.00 * t) +
                        0.15 * Math.sin(2 * Math.PI * 1174.66 * t);
                    sample += wave * attack * decay * 0.22;
                }

                // Chime 2 (Sparkling top overtone: F#5 739.99Hz + D6 1174.66Hz + A6 1760Hz)
                if (i >= chime2Start) {
                    const localI = i - chime2Start;
                    const localT = localI / sampleRate;
                    const remainingLen = length - chime2Start;
                    const progress = localI / remainingLen;
                    const attack = Math.min(1, localT / 0.003);
                    const decay = Math.exp(-progress * 5.5);
                    const wave =
                        0.50 * Math.sin(2 * Math.PI * 739.99 * localT) +
                        0.35 * Math.sin(2 * Math.PI * 1174.66 * localT) +
                        0.15 * Math.sin(2 * Math.PI * 1760.00 * localT);
                    sample += wave * attack * decay * 0.20;
                }

                data[i] = sample;
            }
            return buffer;
        }
    }
}

export function triggerHaptic(pattern: number | number[] = 10) {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    if (localStorage.getItem("sys_enable_sound") === "false") return;
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
        try {
            navigator.vibrate(pattern);
        } catch {
            // Ignore restricted vibration
        }
    }
}

/**
 * Plays warm, cushioned acoustic feedback (zero harshness)
 */
export function playFeedback(type: FeedbackSoundType = "click") {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("sys_enable_sound") === "false") return;

    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        switch (type) {
            case "dial":
                triggerHaptic(5);
                break;
            case "click":
                triggerHaptic(8);
                break;
            case "pickup":
                triggerHaptic(10);
                break;
            case "drop":
                triggerHaptic(15);
                break;
            case "complete":
                triggerHaptic([10, 30, 15]);
                break;
            case "toggle":
                triggerHaptic(12);
                break;
            case "delete":
                triggerHaptic(18);
                break;
            case "switch":
                triggerHaptic([8, 20, 12]);
                break;
        }

        if (!bufferCache[type]) {
            bufferCache[type] = createSoundBuffer(ctx, type);
        }

        const buffer = bufferCache[type];
        if (!buffer) return;

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(ctx.currentTime);
    } catch {
        // Gracefully ignore audio constraints
    }
}
