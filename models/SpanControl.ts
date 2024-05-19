import { Punishment, PunishmentType } from '../controllers/Punishment';
import { AttachmentBuilder, ChannelType, Message } from 'discord.js';
import Client from './Client';
import { Readable } from 'stream';

class SpanControl {
    private antiSpanMessageMapEntry = new Map<string, Message[]>();
    private client: Client;
    constructor(client: Client) {
        this.client = client;
    }
    public SpanDetector(message: Message): void {
        try {
            const { author, guild, member } = message;
            if (!author || !guild || !member || message.channel.type == ChannelType.DM) return;

            const userId = author.id;
            const serverId = guild.id;

            const key: string = userId.concat(serverId);
            if (!this.antiSpanMessageMapEntry.has(key)) {
                this.antiSpanMessageMapEntry.set(key, []);
            }
            const messageEntry = this.antiSpanMessageMapEntry.get(key)!;
            if (messageEntry.length < 5) {
                const timer = setTimeout(() => {
                    this.RemoveMessageEntry(key, message, timer);
                }, 5000);

                messageEntry.push(message);
            } else {
                messageEntry.push(message);
                const attachment = new AttachmentBuilder(
                    new Readable({
                        read() {
                            this.push(`Span detected auto deleted messages at ${new Date().formatDate()}\n\n`);
                            this.push('Deleted Messages:\n\n');
                            this.push(`<UserId> [Username] [DisplayName] at [CreateDate][EditedDate]: Content\n\n`);
                            this.push(messageEntry
                                .map(msg => msg && `${msg.author!.toString()} [${msg.author!.username}] [${msg.author!.displayName}] at [${new Date(msg.createdTimestamp).formatDate()}][${msg.editedTimestamp ? `${new Date(msg.editedTimestamp).formatDate()}` : ''}]: ${msg.content}`)
                                .join('\n'));
                            this.push(null);
                        }
                    }),
                    { name: 'spanDeletedMessages.txt' }
                );
                this.client.info(serverId, `Span detected! Clearing messages and muting user ${message.author.toString()}.`, [attachment]);
                message.channel.bulkDelete(messageEntry);
                message.channel.send('Span detected! Clearing messages and muting user.').then((msg) => {
                    setTimeout(() => {
                        msg.delete();
                    })
                });
                Punishment(member, PunishmentType.MUTE, `You have been muted on ${guild.name} for spamming.`);
            }
        } catch (error) {
            console.error(error);
        }
    }

    private RemoveMessageEntry(key: string, message: Message, timer: NodeJS.Timeout): void {
        try {
            const messageEntry = this.antiSpanMessageMapEntry.get(key);
            if (!messageEntry) return;

            const index = messageEntry.indexOf(message);
            if (index !== -1) {
                clearTimeout(timer);
                messageEntry.splice(index, 1);
            }

            if (messageEntry.length === 0) {
                this.antiSpanMessageMapEntry.delete(key);
            }
        } catch (error) {
            console.error(error);
        }
    }
}

export default SpanControl;