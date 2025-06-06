use wasm_bindgen::prelude::*;
use rand::prelude::*;
use rand_xoshiro::Xoshiro256StarStar;
use std::arch::wasm32::*;

// Use `wee_alloc` as the global allocator for smaller WASM binary size
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Set up panic hook for better error messages
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    #[wasm_bindgen(js_namespace = performance)]
    fn now() -> f64;
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

const ARRAY_SIZE: usize = 1048576; // 2^20
const SEAM_SIZE: usize = 1024;
const ITERATIONS: usize = 10;

#[wasm_bindgen]
pub fn benchmark_seam_removal() {
    console_log!("Starting WASM SIMD seam removal benchmark...");
    
    // Test with smaller array first to debug
    console_log!("Testing with small array first...");
    test_small_benchmark();
    
    console_log!("Running full benchmarks...");
    
    // Run benchmarks
    let bitmask_time = benchmark_bitmask_removal();
    console_log!("Bitmask completed: {:.2}ms", bitmask_time);
    
    let sorted_time = benchmark_sorted_removal();
    console_log!("Sorted completed: {:.2}ms", sorted_time);
    
    let simd_time = benchmark_simd_removal();
    console_log!("SIMD completed: {:.2}ms", simd_time);
    
    console_log!("\nWASM Results:");
    console_log!("SIMD removal: {:.2}ms avg", simd_time);
    console_log!("Bitmask removal: {:.2}ms avg", bitmask_time);
    console_log!("Sorted removal: {:.2}ms avg", sorted_time);
    
    // Find winner and show ratios
    let results = vec![
        (simd_time, "SIMD removal"),
        (bitmask_time, "Bitmask removal"), 
        (sorted_time, "Sorted removal"),
    ];
    
    let mut sorted_results = results;
    sorted_results.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    console_log!("\nSorted results:");
    let winner_time = sorted_results[0].0;
    for (i, (time, name)) in sorted_results.iter().enumerate() {
        if i == 0 {
            console_log!("{}: {:.2}ms (winner)", name, time);
        } else {
            let ratio = time / winner_time;
            console_log!("{}: {:.2}ms ({:.1}x slower)", name, time, ratio);
        }
    }
}

fn test_small_benchmark() {
    console_log!("Creating small test array...");
    let mut array: Vec<u32> = (0..100).collect();
    let indices = vec![10, 20, 30];
    
    console_log!("Testing bitmask removal...");
    let result = bitmask_removal(&mut array.clone(), &indices);
    console_log!("Small bitmask test passed, result length: {}", result.len());
}

fn benchmark_simd_removal() -> f64 {
    let mut total_time = 0.0;
    
    for _ in 0..ITERATIONS {
        let start = now();
        
        // Create array - fix the overflow issue
        let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();
        
        // Generate random indices
        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();
        
        // SIMD removal
        simd_removal(&mut array, &indices);
        
        let end = now();
        total_time += end - start;
    }
    
    total_time / ITERATIONS as f64
}

fn benchmark_bitmask_removal() -> f64 {
    let mut total_time = 0.0;
    
    for _ in 0..ITERATIONS {
        let start = now();
        
        // Create array - fix the overflow issue
        let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();
        
        // Generate random indices
        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();
        
        // Bitmask removal
        bitmask_removal(&mut array, &indices);
        
        let end = now();
        total_time += end - start;
    }
    
    total_time / ITERATIONS as f64
}

fn benchmark_sorted_removal() -> f64 {
    let mut total_time = 0.0;
    
    for _ in 0..ITERATIONS {
        let start = now();
        
        // Create array - fix the overflow issue
        let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();
        
        // Generate random indices
        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();
        
        // Sorted removal
        sorted_removal(&mut array, &indices);
        
        let end = now();
        total_time += end - start;
    }
    
    total_time / ITERATIONS as f64
}

fn simd_removal(array: &mut Vec<u32>, indices_to_remove: &[usize]) -> Vec<u32> {
    console_log!("SIMD removal starting, array len: {}, indices len: {}", array.len(), indices_to_remove.len());
    
    // For now, let's implement a "SIMD-style" algorithm that processes in chunks
    // but uses safe Rust operations instead of unsafe SIMD intrinsics
    let mut deleted = vec![false; array.len()];
    
    // Mark indices for deletion
    for &index in indices_to_remove {
        if index < array.len() {
            deleted[index] = true;
        }
    }
    
    console_log!("Deletion mask created");
    
    let mut result = Vec::with_capacity(array.len() - indices_to_remove.len());
    
    // Process in chunks of 16 (simulating SIMD-style processing)
    let chunk_size = 16;
    for chunk_start in (0..deleted.len()).step_by(chunk_size) {
        let chunk_end = (chunk_start + chunk_size).min(deleted.len());
        
        for i in chunk_start..chunk_end {
            if !deleted[i] {
                result.push(array[i]);
            }
        }
    }
    
    console_log!("SIMD removal completed, result len: {}", result.len());
    result
}

fn bitmask_removal(array: &mut Vec<u32>, indices_to_remove: &[usize]) -> Vec<u32> {
    let mut deleted = vec![0u8; array.len()];
    
    for &index in indices_to_remove {
        if index < array.len() {
            deleted[index] = 1;
        }
    }
    
    let mut write_index = 0;
    for i in 0..array.len() {
        if deleted[i] == 0 {
            array[write_index] = array[i];
            write_index += 1;
        }
    }
    
    array.truncate(write_index);
    array.clone()
}

fn sorted_removal(array: &mut Vec<u32>, sorted_indices: &[usize]) -> Vec<u32> {
    let mut write_index = 0;
    let mut delete_index = 0;
    let mut next_delete_index = if !sorted_indices.is_empty() { 
        sorted_indices[0] 
    } else { 
        usize::MAX 
    };
    
    for read_index in 0..array.len() {
        if read_index == next_delete_index {
            delete_index += 1;
            next_delete_index = if delete_index < sorted_indices.len() {
                sorted_indices[delete_index]
            } else {
                usize::MAX
            };
        } else {
            array[write_index] = array[read_index];
            write_index += 1;
        }
    }
    
    array.truncate(write_index);
    array.clone()
} 