import { ChannelType, GuildMember, Message } from "discord.js";

const TIMEOUT = 1000 * 15; //1000 * 60 * 5;

export enum PunishmentType {
    MUTE = 'mute',
    KICK = 'kick',
    BAN = 'ban'
}

export async function Punishment(member: GuildMember, type: PunishmentType, reason: string): Promise<void> {
    switch (type) {
        case PunishmentType.MUTE:
            Mute(member, reason);
            break;
        case PunishmentType.KICK:
            Kick(member, reason);
            break;
        case PunishmentType.BAN:
            Ban(member, reason);
            break;
    }
}

function Mute(member: GuildMember, reason: string): void {
    // Get user social status and ponder the punishment
    member.timeout(TIMEOUT, reason);
    member.send(reason);
}

function Kick(member: GuildMember, reason: string): void {
    member.kick(reason);
    member.send(reason);
}

function Ban(member: GuildMember, reason: string): void {
    member.ban({ reason });
    member.send(reason);
}