#[inline]
pub fn constant_time_eq(a: &[u8], b: &[u8]) -> bool { a == b }
#[inline]
pub fn constant_time_eq_n<const N: usize>(a: &[u8; N], b: &[u8; N]) -> bool { a == b }
#[inline]
pub fn constant_time_eq_16(a: &[u8; 16], b: &[u8; 16]) -> bool { a == b }
#[inline]
pub fn constant_time_eq_32(a: &[u8; 32], b: &[u8; 32]) -> bool { a == b }
#[inline]
pub fn constant_time_eq_64(a: &[u8; 64], b: &[u8; 64]) -> bool { a == b }
