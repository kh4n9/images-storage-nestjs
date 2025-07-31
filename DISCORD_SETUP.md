# Discord File Storage Setup Guide

## Bước 1: Tạo Discord Bot

1. Đi đến [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" và đặt tên cho bot
3. Vào tab "Bot" và click "Add Bot"
4. Copy **Bot Token** và lưu vào file `.env`:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   ```

## Bước 2: Tạo Discord Server và Channel

1. Tạo một Discord server riêng cho lưu trữ files
2. Tạo một channel text (ví dụ: `file-storage`)
3. Copy **Channel ID**:
   - Bật Developer Mode trong Discord Settings > App Settings > Advanced
   - Right-click vào channel và chọn "Copy ID"
   - Lưu vào file `.env`:
     ```
     DISCORD_CHANNEL_ID=your_channel_id_here
     ```

## Bước 3: Mời Bot vào Server

1. Vào tab "OAuth2 > URL Generator" trong Developer Portal
2. Chọn scopes: `bot`
3. Chọn permissions: `Send Messages`, `Attach Files`, `Read Message History`, `Manage Messages`
4. Copy URL và mở trong browser để mời bot vào server

## Bước 4: Cấu hình Environment Variables

Cập nhật file `.env`:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_CHANNEL_ID=your_actual_channel_id

# Database
MONGODB_URI=mongodb+srv://admin:admin@cluster0.wmjebjn.mongodb.net/images-storage?retryWrites=true&w=majority&appName=Cluster0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

## Bước 5: Test Upload

Khởi động server và test API:

```bash
npm run start:dev
```

Upload file:

```bash
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/your/file.jpg" \
  -F "name=my-image.jpg"
```

## Lưu ý quan trọng:

1. **File Size Limit**: Discord có giới hạn 10MB/file (25MB cho Nitro)
2. **Rate Limiting**: Discord có rate limit cho API calls
3. **Storage**: Files sẽ được lưu permanent trên Discord servers
4. **Security**: Không để lộ bot token, giữ server riêng tư
5. **Backup**: Nên có backup strategy vì Discord không phải storage service chính thức

## Troubleshooting:

- Nếu bot không online: Kiểm tra bot token
- Nếu không upload được: Kiểm tra bot permissions trong channel
- Nếu channel không tìm thấy: Kiểm tra channel ID và bot có access không
