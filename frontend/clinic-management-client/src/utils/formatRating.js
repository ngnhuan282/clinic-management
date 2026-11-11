export const formatRating = value => value == null ? "Chưa có" : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value) + " / 5";
