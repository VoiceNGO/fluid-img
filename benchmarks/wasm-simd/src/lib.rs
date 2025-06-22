use rand::prelude::*;
use rand_xoshiro::Xoshiro256StarStar;
use std::arch::wasm32::*;
use std::ptr;
use wasm_bindgen::prelude::*;

mod simd_helpers;
use simd_helpers::*;

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
    let array: Vec<u32> = (0..100).collect();
    let indices = vec![10, 20, 30];

    console_log!("Testing bitmask removal...");
    let result = bitmask_removal(&mut array.clone(), &indices);
    console_log!("Small bitmask test passed, result length: {}", result.len());
}

fn benchmark_simd_removal() -> f64 {
    let mut total_time = 0.0;

    // Create the array once and reuse it
    let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();

    for i in 0..ITERATIONS {
        console_log!("SIMD iteration {}", i + 1);
        let start = now();

        // Reset the array to original state
        array.clear();
        array.extend(0..ARRAY_SIZE as u32);

        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();

        let result = simd_removal(&mut array, &indices);
        // Put the result back into array for next iteration
        array = result;

        let end = now();
        total_time += end - start;
        console_log!("SIMD iteration {} completed", i + 1);
    }

    total_time / ITERATIONS as f64
}

fn benchmark_bitmask_removal() -> f64 {
    let mut total_time = 0.0;

    for _ in 0..ITERATIONS {
        let start = now();

        let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();

        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();

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

        let mut array: Vec<u32> = (0..ARRAY_SIZE as u32).collect();

        let mut rng = Xoshiro256StarStar::seed_from_u64(42);
        let mut indices: Vec<usize> = (0..SEAM_SIZE)
            .map(|_| rng.gen_range(0..ARRAY_SIZE))
            .collect();
        indices.sort_unstable();
        indices.dedup();

        sorted_removal(&mut array, &indices);

        let end = now();
        total_time += end - start;
    }

    total_time / ITERATIONS as f64
}

fn simd_removal(array: &mut Vec<u32>, indices_to_remove: &[usize]) -> Vec<u32> {
    unsafe { simd_removal_inner(array, indices_to_remove) }
}

#[target_feature(enable = "simd128")]
unsafe fn simd_removal_inner(array: &mut Vec<u32>, indices_to_remove: &[usize]) -> Vec<u32> {
    let mut deleted = vec![0u8; array.len()];
    for &index in indices_to_remove {
        if index < deleted.len() {
            deleted[index] = 1;
        }
    }

    let mut write_index = 0;
    let mut read_index = 0;
    let len = array.len();
    let zero_vec = u8x16_splat(0);

    // Process chunks of 16 u32s (64 bytes) with SIMD mask generation
    const BIG_CHUNK_SIZE: usize = 16;
    while read_index + BIG_CHUNK_SIZE <= len {
        let deleted_ptr = deleted.as_ptr().add(read_index);
        let deleted_chunk: [u8; 16] = ptr::read_unaligned(deleted_ptr as *const [u8; 16]);
        let deleted_vec = v128_load(deleted_chunk.as_ptr() as *const v128);
        let eq_zero_mask = u8x16_eq(deleted_vec, zero_vec);
        let keep_mask = u8x16_bitmask(eq_zero_mask) as u16;

        if keep_mask == 0 {
            // All elements deleted, skip
            read_index += BIG_CHUNK_SIZE;
            continue;
        }

        if keep_mask == 0xFFFF {
            // All elements kept, fast copy
            let read_ptr = array.as_ptr().add(read_index);
            let write_ptr = array.as_mut_ptr().add(write_index);
            ptr::copy(read_ptr, write_ptr, BIG_CHUNK_SIZE);
            write_index += BIG_CHUNK_SIZE;
            read_index += BIG_CHUNK_SIZE;
            continue;
        }

        // Mixed case: process in 4-element sub-chunks
        for i in 0..4 {
            let sub_mask = ((keep_mask >> (i * 4)) & 0xF) as usize;
            if sub_mask == 0 {
                continue;
            }

            let current_read_ptr = array.as_ptr().add(read_index + i * 4);
            let data_chunk: [u32; 4] = ptr::read_unaligned(current_read_ptr as *const [u32; 4]);
            let data_vec = v128_load(data_chunk.as_ptr() as *const v128);

            let shuffle_mask_vec = SHUFFLE_MASKS[sub_mask];
            let compacted_vec = u8x16_swizzle(data_vec, shuffle_mask_vec);
            let compacted_count = POPCOUNT_TABLE[sub_mask] as usize;

            let write_ptr = array.as_mut_ptr().add(write_index);
            let mut temp_array = [0u32; 4];
            v128_store(temp_array.as_mut_ptr() as *mut v128, compacted_vec);
            ptr::copy_nonoverlapping(temp_array.as_ptr(), write_ptr, compacted_count);
            write_index += compacted_count;
        }

        read_index += BIG_CHUNK_SIZE;
    }

    // Handle remaining elements with 4-element SIMD
    const SMALL_CHUNK_SIZE: usize = 4;
    while read_index + SMALL_CHUNK_SIZE <= len {
        let mut keep_mask = 0u16;
        for i in 0..SMALL_CHUNK_SIZE {
            if deleted[read_index + i] == 0 {
                keep_mask |= 1 << i;
            }
        }
        let keep_mask_usize = keep_mask as usize;

        if keep_mask_usize > 0 {
            let data_ptr = array.as_ptr().add(read_index);
            let data_chunk: [u32; 4] = ptr::read_unaligned(data_ptr as *const [u32; 4]);
            let data_vec = v128_load(data_chunk.as_ptr() as *const v128);
            let compacted_vec = u8x16_swizzle(data_vec, SHUFFLE_MASKS[keep_mask_usize]);
            let compacted_count = POPCOUNT_TABLE[keep_mask_usize] as usize;

            let write_ptr = array.as_mut_ptr().add(write_index);
            let mut temp_array = [0u32; 4];
            v128_store(temp_array.as_mut_ptr() as *mut v128, compacted_vec);
            ptr::copy_nonoverlapping(temp_array.as_ptr(), write_ptr, compacted_count);
            write_index += compacted_count;
        }

        read_index += SMALL_CHUNK_SIZE;
    }

    // Handle final elements scalar
    while read_index < len {
        if deleted[read_index] == 0 {
            array[write_index] = array[read_index];
            write_index += 1;
        }
        read_index += 1;
    }

    array.truncate(write_index);

    // Take ownership instead of cloning
    let mut result = Vec::new();
    std::mem::swap(&mut result, array);
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
