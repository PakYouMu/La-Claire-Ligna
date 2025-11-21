use wasm_bindgen::prelude::*;

// Constants mirroring your JS optimizations
const PI: f32 = 3.141592653589793;
const TWO_PI: f32 = 6.283185307179586;
const HALF_PI: f32 = 1.5707963267948966;
const LUT_SIZE: usize = 4096 + 256;
const SIN_MASK: usize = 4095;
const NOISE_OFFSET: usize = 4096;
const NOISE_MASK: usize = 255;
const SIN_SCALE: f32 = 4096.0 / TWO_PI;
const STRIDE: usize = 5;
const MAX_SRC: usize = 25;

#[wasm_bindgen]
pub struct WaveEngine {
    lut: Vec<f32>,
    // Buffers
    disp: Vec<f32>,
    fall: Vec<f32>,
    y: Vec<f32>,
    stamp: Vec<f32>,
    // Source Data: [x, y, time, intensity, strength]
    sources: Vec<f32>, 
    src_count: usize,
    src_idx: usize,
    // Dimensions
    width: f32,
    height: f32,
    center_y: f32,
    inv_center_y: f32,
    num_points: usize,
    step: f32,
    // Config cache
    conf_gfreq: f32,
    conf_gamp: f32,
    conf_inf: f32,
    conf_damp: f32,
    conf_lvt_inv: f32,
    conf_min_l: f32,
    conf_l_rng: f32,
    // Dynamic Wave Params (The randomized values)
    wave_freq: f32,
    wave_speed: f32,
    wave_amp: f32,
}

#[wasm_bindgen]
impl WaveEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WaveEngine {
        let mut lut = vec![0.0; LUT_SIZE];
        
        // 1. Exact Replica of JS LUT Generation
        for i in 0..4096 {
            lut[i] = ((i as f32 / 4096.0) * TWO_PI).sin();
        }
        
        // 2. Exact Replica of JS Noise Generation
        for i in 0..256 {
            let n = (i as f32 * 12.9898 + i as f32).sin().abs() * 43758.5453;
            let fract = n - n.floor();
            lut[NOISE_OFFSET + i] = 0.4 + fract * 0.6;
        }

        WaveEngine {
            lut,
            disp: Vec::new(),
            fall: Vec::new(),
            y: Vec::new(),
            stamp: Vec::new(),
            sources: vec![0.0; MAX_SRC * STRIDE],
            src_count: 0,
            src_idx: 0,
            width: 0.0,
            height: 0.0,
            center_y: 0.0,
            inv_center_y: 0.0,
            num_points: 0,
            step: 3.0, 
            // Default config placeholders
            conf_gfreq: 0.02,
            conf_gamp: 5.0,
            conf_inf: 420.0,
            conf_damp: 0.069,
            conf_lvt_inv: 1.0,
            conf_min_l: 600.0,
            conf_l_rng: 1600.0,
            // Default dynamic params
            wave_freq: 0.04,
            wave_speed: 0.7,
            wave_amp: 0.2,
        }
    }

    // Helpers to match JS lookups exactly
    #[inline(always)]
    fn fast_sin(&self, x: f32) -> f32 {
        let idx = (x * SIN_SCALE) as usize & SIN_MASK;
        unsafe { *self.lut.get_unchecked(idx) }
    }

    #[inline(always)]
    fn fast_cos(&self, x: f32) -> f32 {
        let idx = ((x + HALF_PI) * SIN_SCALE) as usize & SIN_MASK;
        unsafe { *self.lut.get_unchecked(idx) }
    }

    #[inline(always)]
    fn fast_noise(&self, i: usize) -> f32 {
        unsafe { *self.lut.get_unchecked(NOISE_OFFSET + (i & NOISE_MASK)) }
    }

    pub fn configure(&mut self, gfreq: f32, gamp: f32, inf: f32, damp: f32, lvt: f32, min_l: f32, max_l: f32) {
        self.conf_gfreq = gfreq;
        self.conf_gamp = gamp;
        self.conf_inf = inf;
        self.conf_damp = damp;
        self.conf_lvt_inv = 1.0 / lvt;
        self.conf_min_l = min_l;
        self.conf_l_rng = max_l - min_l;

        // Recompute stamp if influence changes
        let step = 3.0; // hardcoded step
        let stamp_px = ((inf * 2.0 / step) as usize) + 1;
        self.stamp = vec![0.0; stamp_px];
        let inv_inf = 1.0 / inf;
        
        for i in 0..stamp_px {
            let local_x = (i as f32 * step) - inf;
            let nd = local_x.abs() * inv_inf;
            let t = 1.0 - nd;
            self.stamp[i] = if t > 0.0 { t * t * (3.0 - t - t) } else { 0.0 };
        }
    }

    pub fn set_wave_params(&mut self, freq: f32, speed: f32, amp: f32) {
        self.wave_freq = freq;
        self.wave_speed = speed;
        self.wave_amp = amp;
    }

    pub fn resize(&mut self, width: f32, height: f32) {
        self.width = width;
        self.height = height;
        self.center_y = height * 0.5;
        self.inv_center_y = 2.0 / height;
        self.step = 3.0;

        self.num_points = ((width / self.step) as usize) + 2;
        
        // Reallocate buffers
        self.disp = vec![0.0; self.num_points];
        self.fall = vec![0.0; self.num_points];
        self.y = vec![0.0; self.num_points];
    }

    pub fn add_source(&mut self, x: f32, y: f32, time: f32, intensity: f32) {
        let idx = if self.src_count < MAX_SRC {
             let i = self.src_count * STRIDE;
             self.src_count += 1;
             i
        } else {
            let i = self.src_idx * STRIDE;
            self.src_idx = (self.src_idx + 1) % MAX_SRC;
            i
        };

        self.sources[idx] = x;
        self.sources[idx+1] = y;
        self.sources[idx+2] = time;
        self.sources[idx+3] = intensity;
        self.sources[idx+4] = 1.0;
    }

    pub fn compute(&mut self, now: f32, phase: f32) -> *const f32 {
        // Clear buffers
        for x in &mut self.disp { *x = 0.0; }
        for x in &mut self.fall { *x = 0.0; }

        let stamp_sz = self.stamp.len();
        
        let mut i = 0;
        while i < self.src_count {
            let base = i * STRIDE;
            let intensity = self.sources[base + 3];
            let created = self.sources[base + 2];
            
            let mut ratio = intensity * self.conf_lvt_inv;
            if ratio > 1.0 { ratio = 1.0; }
            
            let linger = self.conf_min_l + self.conf_l_rng * ratio;
            let age = now - created;

            if age >= linger {
                // Swap remove logic
                if i != self.src_count - 1 {
                     let last = (self.src_count - 1) * STRIDE;
                     for k in 0..STRIDE {
                         self.sources[base + k] = self.sources[last + k];
                     }
                }
                self.src_count -= 1;
                continue;
            }

            let prog = age / linger;
            let inv = 1.0 - prog;
            let strength = inv * inv;
            self.sources[base + 4] = strength; // update strength storage
            
            let sx = self.sources[base];
            let sy = self.sources[base + 1];
            
            let dist_y = (sy - self.center_y).abs();
            let adv_amp = (1.0 - dist_y * self.inv_center_y) * self.center_y * self.conf_damp;

            // Stamp application
            let start_idx = ((sx - self.conf_inf) / self.step) as isize;
            let end_idx = ((sx + self.conf_inf) / self.step) as isize;
            
            let si = if start_idx < 0 { 0 } else { start_idx as usize };
            let ei = if end_idx >= self.num_points as isize { self.num_points - 1 } else { end_idx as usize };

            // The core "Noise" loop from JS
            for j in si..=ei {
                 let x_pos = j as f32 * self.step;
                 let sti = ((x_pos - sx + self.conf_inf) / self.step) as isize;
                 
                 if sti >= 0 && (sti as usize) < stamp_sz {
                     let fo = unsafe { *self.stamp.get_unchecked(sti as usize) } * strength;
                     
                     // wph = x * mfreq + ph * mspeed
                     let wph = x_pos * self.wave_freq + phase * self.wave_speed;
                     
                     // ni = (wph * INV_PI) | 0
                     let ni = (wph * 0.31830988) as usize; 
                     
                     let a1 = self.fast_noise(ni);
                     let a2 = self.fast_noise(ni + 1);
                     let fp = (wph - (ni as f32) * PI) * 0.31830988;
                     let sf = (1.0 - self.fast_cos(fp * PI)) * 0.5;
                     let ia = a1 + (a2 - a1) * sf;
                     
                     // disp[j] += sin(wph) * advAmp * fo * mamp * ia
                     let val = self.fast_sin(wph) * adv_amp * fo * self.wave_amp * ia;
                     
                     self.disp[j] += val;
                     if fo > self.fall[j] { self.fall[j] = fo; }
                 }
            }
            i += 1;
        }

        // Final Y Loop
        for j in 0..self.num_points {
             let x = j as f32 * self.step;
             // Global sine + displacement
             let base_wave = self.fast_sin(x * self.conf_gfreq + phase) * self.conf_gamp;
             let fall_mod = 1.0 - self.fall[j];
             self.y[j] = self.center_y + base_wave * fall_mod + self.disp[j];
        }

        self.y.as_ptr()
    }

    pub fn get_num_points(&self) -> usize { self.num_points }
    pub fn get_step(&self) -> f32 { self.step }
    pub fn get_center_y(&self) -> f32 { self.center_y }
}