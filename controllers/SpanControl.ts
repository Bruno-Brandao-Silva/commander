import { ChannelType, Message } from 'discord.js';
import { Punishment, PunishmentType } from './Punishment';

const antiSpanMessageMapEntry = new Map<string, Message[]>();

function SpanDetector(message: Message): void {
    const { author, guild, member } = message;
    if (!author || !guild || !member || message.channel.type == ChannelType.DM) return;

    const userId = author.id;
    const serverId = guild.id;

    const key: string = userId.concat(serverId);
    if (!antiSpanMessageMapEntry.has(key)) {
        antiSpanMessageMapEntry.set(key, []);
    }
    const messageEntry = antiSpanMessageMapEntry.get(key)!;
    if (messageEntry.length < 5) {
        const timer = setTimeout(() => {
            RemoveMessageEntry(key, message, timer);
        }, 5000);

        messageEntry.push(message);
    } else {
        message.delete();
        message.channel.bulkDelete(messageEntry);
        message.channel.send('Span detected! Clearing messages and muting user.').then((msg) => {
            setTimeout(() => {
                msg.delete();
            })
        });
        Punishment(member, PunishmentType.MUTE, 'You have been muted for spamming.');
    }
}

function RemoveMessageEntry(key: string, message: Message, timer: NodeJS.Timeout): void {
    const messageEntry = antiSpanMessageMapEntry.get(key);
    if (!messageEntry) return;

    const index = messageEntry.indexOf(message);
    if (index !== -1) {
        clearTimeout(timer);
        messageEntry.splice(index, 1);
    }

    if (messageEntry.length === 0) {
        antiSpanMessageMapEntry.delete(key);
    }
}

export default SpanDetector;