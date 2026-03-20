# Discord Collect Income & Deposit Bot

Tự động gửi lệnh `/collect-income` và `/deposit all` của bot [UnbelievaBoat](https://unbelievaboat.com/) theo chu kỳ 8 tiếng với thời gian ngẫu nhiên.

## Tính năng

- Hỗ trợ nhiều tài khoản Discord cùng lúc (`tokens.txt`)
- Loop vô hạn với interval **8 tiếng + random** (tránh bị detect)
- Delay ngẫu nhiên giữa các tài khoản
- Log màu sắc trực quan theo thời gian thực
- Safety timeout cho mỗi tài khoản
- Tự động deposit toàn bộ số tiền đã collect vào bank sau mỗi lần collect
- Tự động rob người dùng vừa withdraw tiền từ bank (check balance trước, chỉ rob nếu cash >500)
- Limit số lần rob/crime/ngày (max 20 rob, 40 crime) để tránh ban

## Cài đặt

```bash
cd collect-income
npm install
```

## Cấu hình

### 1. Thêm Discord Token vào `tokens.txt`

Mỗi token một dòng. Dòng bắt đầu bằng `#` hoặc `//` là comment.

```
MTIzNDU2Nzg5MDEyMzQ1Njc4.GxxxXx.xxxxxxxxxx
MTIzNDU2Nzg5MDEyMzQ1Njc5.GxxxXx.yyyyyyyyyy
```

**Cách lấy Discord User Token:**
1. Mở Discord trên **trình duyệt** (https://discord.com/app)
2. Nhấn `F12` → tab **Network**
3. Reload trang (`Ctrl+R`)
4. Tìm bất kỳ request nào đến `discord.com/api`
5. Xem Header **`Authorization`** → copy giá trị đó

### 2. Chỉnh `config.js`

```js
CHANNEL_IDS: ["123456789012345678", "987654321098765432"],  // Array ID các channel muốn gửi lệnh
```

**Cách lấy Channel ID:**
- Bật Developer Mode trong Discord (Settings → Advanced → Developer Mode)
- Chuột phải vào channel → **Copy Channel ID**
- Thêm vào array CHANNEL_IDS

### 3. Cấu hình nâng cao (tuỳ chọn)

| Cấu hình | Mặc định | Mô tả |
|---|---|---|
| `BASE_INTERVAL_HOURS` | `8` | Giờ giữa mỗi vòng collect |
| `RANDOM_EXTRA_MIN_MINUTES` | `1` | Thêm tối thiểu X phút ngẫu nhiên |
| `RANDOM_EXTRA_MAX_MINUTES` | `30` | Thêm tối đa X phút ngẫu nhiên |
| `DELAY_BETWEEN_ACCOUNTS_MIN` | `5` | Delay tối thiểu giữa tài khoản (giây) |
| `DELAY_BETWEEN_ACCOUNTS_MAX` | `15` | Delay tối đa giữa tài khoản (giây) |
| `ACCOUNT_TIMEOUT` | `30` | Timeout mỗi tài khoản (giây) |
| `WAIT_AFTER_SEND` | `5` | Chờ bot phản hồi sau khi gửi (giây) |
| `ENABLE_ROB` | `true` | Bật rob top cash user |
| `ENABLE_CRIME` | `true` | Bật crime sau rob |
| `WAIT_AFTER_LEADERBOARD` | `3` | Chờ phản hồi leaderboard (giây) |
| `WAIT_AFTER_ROB_CRIME` | `2` | Chờ phản hồi rob/crime (giây) |
| `ENABLE_AUTO_ROB_WITHDRAW` | `true` | Bật auto rob khi detect withdraw |
| `MIN_QUICK_ROB_CASH` | `500` | Cash tối thiểu để quick rob (tránh mất tiền) |
| `MAX_ROB_PER_DAY` | `20` | Max rob/ngày |
| `MAX_CRIME_PER_DAY` | `40` | Max crime/ngày |

## Chạy

```bash
npm start
```

## Lưu ý

- Sử dụng **user token** cá nhân (self-bot) — vi phạm ToS của Discord. Dùng có trách nhiệm.
- Không chia sẻ token với bất kỳ ai.
- Bot UnbelievaBoat (`292953664492929025`) phải có trong server của channel đó.
- Rob/crime có rủi ro mất tiền nếu fail — bot đã có bảo vệ check balance.
- Limit/ngày để tránh ban Discord.
