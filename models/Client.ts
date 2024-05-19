import { Client as DiscordClient, ClientOptions, TextChannel, EmbedBuilder, Embed, AttachmentBuilder, Message } from 'discord.js';
import SpanControl from './SpanControl';

class Client extends DiscordClient {
	private guildChannelMap: Map<string, string> = new Map();
	private spanControl: SpanControl = new SpanControl(this);

	constructor(options: ClientOptions) {
		super(options);
	}

	public SpanDetector = (message: Message) => this.spanControl.SpanDetector(message);

	private async getLogChannel(guildId: string): Promise<TextChannel | null> {
		const guild = this.guilds.cache.get(guildId);
		if (!guild) return null;
		const channelId = this.guildChannelMap.get(guildId);
		if (!channelId) return null;
		const channel = guild.channels.cache.get(channelId) as TextChannel;
		return channel;
	}

	private async log(guildId: string, level: 'info' | 'error', message: string, attachments?: AttachmentBuilder[]) {
		const logChannel = await this.getLogChannel(guildId);
		if (!logChannel) return;

		const embed = new EmbedBuilder()
			.setColor(level === 'error' ? '#FF0000' : '#00FF00')
			.setTitle(`Log: ${level.toUpperCase()}`)
			.setDescription(message)
			.setTimestamp();

		logChannel.send({
			embeds: [embed],
		}).then(() => {
			attachments && attachments.forEach((attachment) => {
				logChannel.send({
					files: [attachment],
				});
			});
		});
	}

	public info(guildId: string, message: string, attachments?: AttachmentBuilder[]) {
		this.log(guildId, 'info', message, attachments);
	}

	public error(guildId: string, message: string, attachments?: AttachmentBuilder[]) {
		this.log(guildId, 'error', message, attachments);
	}
	
	public setLogChannel(guildId: string, channelId: string) {
		this.guildChannelMap.set(guildId, channelId);
	}
}

export default Client;
