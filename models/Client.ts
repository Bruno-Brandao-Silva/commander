import { Client as DiscordClient, ClientOptions, TextChannel, EmbedBuilder, Embed } from 'discord.js';

class Client extends DiscordClient {
	private guildChannelMap: Map<string, string>;

	constructor(options: ClientOptions) {
		super(options);
		this.guildChannelMap = new Map();
	}

	private async getLogChannel(guildId: string): Promise<TextChannel | null> {
		const guild = this.guilds.cache.get(guildId);
		if (!guild) return null;
		const channelId = this.guildChannelMap.get(guildId);
		if (!channelId) return null;
		const channel = guild.channels.cache.get(channelId) as TextChannel;
		return channel;
	}

	private async log(guildId: string, level: 'info' | 'error', message: string, files?: EmbedFiles) {
		const logChannel = await this.getLogChannel(guildId);
		if (!logChannel) return;

		const embed = new EmbedBuilder()
			.setColor(level === 'error' ? '#FF0000' : '#00FF00')
			.setTitle(`Log: ${level.toUpperCase()}`)
			.setDescription(message)
			.setTimestamp();

		logChannel.send({
			embeds: [embed],
			files
		});
	}

	public info(guildId: string, message: string, files?: EmbedFiles) {
		this.log(guildId, 'info', message, files);
	}

	public error(guildId: string, message: string, files?: EmbedFiles) {
		this.log(guildId, 'error', message, files);
	}
	public setLogChannel(guildId: string, channelId: string) {
		this.guildChannelMap.set(guildId, channelId);
	}
}

export default Client;
