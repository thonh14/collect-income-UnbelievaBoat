// ============================================================
// Discord Collect Income Bot - Configuration
// UnbelievaBoat /collect-income auto-claimer
// Bot: https://unbelievaboat.com/
// ============================================================

const CONFIG = {
  // ---- Discord Settings ----
  // Channel ID để gửi lệnh /collect-income (click chuột phải vào channel → Copy Channel ID)
  CHANNEL_ID: "1483747272104743052",

  // Application ID của bot UnbelievaBoat (không cần thay đổi)
  UNBELIEVA_APP_ID: "292953664492929025",

  // ---- Loop Settings ----
  // Khoảng thời gian cơ bản giữa mỗi vòng lặp (giờ)
  // UnbelievaBoat /collect-income cooldown thường là 8 giờ
  BASE_INTERVAL_HOURS: 8,

  // Random thêm thời gian (phút) để tránh pattern cố định → giảm nguy cơ bị detect
  RANDOM_EXTRA_MIN_MINUTES: 0.5,   // Tối thiểu thêm 0.5 phút
  RANDOM_EXTRA_MAX_MINUTES: 1,  // Tối đa thêm 1 phút

  // ---- Delay Between Accounts ----
  // Độ trễ giữa các tài khoản (giây) để tránh spam quá nhanh
  DELAY_BETWEEN_ACCOUNTS_MIN: 5,  // Tối thiểu X giây
  DELAY_BETWEEN_ACCOUNTS_MAX: 15, // Tối đa X giây

  // ---- Timeout Settings ----
  // Thời gian tối đa chờ một tài khoản hoàn thành (giây)
  ACCOUNT_TIMEOUT: 30,

  // Chờ sau khi gửi lệnh để bot phản hồi (giây)
  WAIT_AFTER_SEND: 5,
};

module.exports = { CONFIG };
