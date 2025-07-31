import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  GatewayIntentBits,
  TextChannel,
  AttachmentBuilder,
} from 'discord.js';
import axios from 'axios';

export interface DiscordUploadResult {
  url: string;
  messageId: string;
  filename: string;
  size: number;
}

@Injectable()
export class DiscordStorageService {
  private readonly logger = new Logger(DiscordStorageService.name);
  private client: Client;
  private isReady = false;

  constructor(private configService: ConfigService) {
    this.initializeBot();
  }

  private async initializeBot() {
    const token = this.configService.get<string>('DISCORD_BOT_TOKEN');

    if (!token) {
      this.logger.warn(
        'Discord bot token not provided. Discord storage will not be available.',
      );
      return;
    }

    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    this.client.once('ready', () => {
      this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
    });

    try {
      await this.client.login(token);
    } catch (error) {
      this.logger.error('Failed to login to Discord:', error);
    }
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    originalName?: string,
  ): Promise<DiscordUploadResult> {
    if (!this.isReady || !this.client) {
      throw new Error('Discord bot is not ready');
    }

    const channelId = this.configService.get<string>('DISCORD_CHANNEL_ID');
    if (!channelId) {
      throw new Error('Discord channel ID not configured');
    }

    try {
      const channel = (await this.client.channels.fetch(
        channelId,
      )) as TextChannel;
      if (!channel || !channel.isTextBased()) {
        throw new Error('Invalid Discord channel');
      }

      const attachment = new AttachmentBuilder(buffer, { name: filename });

      const message = await channel.send({
        content: `📁 **File Upload**\n🏷️ **Original Name:** ${originalName || filename}\n📊 **Size:** ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n⏰ **Uploaded:** ${new Date().toISOString()}`,
        files: [attachment],
      });

      // Lấy URL của file đã upload
      const fileUrl = message.attachments.first()?.url;
      if (!fileUrl) {
        throw new Error('Failed to get file URL from Discord');
      }

      return {
        url: fileUrl,
        messageId: message.id,
        filename: filename,
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error('Failed to upload file to Discord:', error);
      throw new Error(`Discord upload failed: ${error.message}`);
    }
  }

  async deleteFile(messageId: string): Promise<boolean> {
    if (!this.isReady || !this.client) {
      throw new Error('Discord bot is not ready');
    }

    const channelId = this.configService.get<string>('DISCORD_CHANNEL_ID');
    if (!channelId) {
      throw new Error('Discord channel ID not configured');
    }

    try {
      const channel = (await this.client.channels.fetch(
        channelId,
      )) as TextChannel;
      if (!channel || !channel.isTextBased()) {
        throw new Error('Invalid Discord channel');
      }

      const message = await channel.messages.fetch(messageId);
      await message.delete();

      this.logger.log(`Deleted Discord message ${messageId}`);
      return true;
    } catch (error) {
      // Handle specific Discord API errors
      if (error.code === 10008) {
        // Unknown Message - message already deleted or doesn't exist
        this.logger.warn(
          `Discord message ${messageId} not found (already deleted)`,
        );
        return true; // Consider it successful since the message is gone
      }

      if (error.code === 50001) {
        // Missing Access
        this.logger.error(
          `Missing access to delete Discord message ${messageId}`,
        );
        return false;
      }

      if (error.code === 50013) {
        // Missing Permissions
        this.logger.error(
          `Missing permissions to delete Discord message ${messageId}`,
        );
        return false;
      }

      // Log other errors
      this.logger.error('Failed to delete Discord message:', error);
      return false;
    }
  }

  // Utility method to check if a Discord message exists
  async messageExists(messageId: string): Promise<boolean> {
    if (!this.isReady || !this.client) {
      return false;
    }

    const channelId = this.configService.get<string>('DISCORD_CHANNEL_ID');
    if (!channelId) {
      return false;
    }

    try {
      const channel = (await this.client.channels.fetch(
        channelId,
      )) as TextChannel;
      if (!channel || !channel.isTextBased()) {
        return false;
      }

      await channel.messages.fetch(messageId);
      return true;
    } catch (error) {
      if (error.code === 10008) {
        // Unknown Message
        return false;
      }
      // Other errors might be temporary, assume exists
      return true;
    }
  }

  async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
      });

      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error('Failed to download file from Discord:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  isAvailable(): boolean {
    return this.isReady;
  }
}
