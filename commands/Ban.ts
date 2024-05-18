import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import Client from "../models/Client";

export const BanCommandJSON = new SlashCommandBuilder().
    setName("ban").
    setDescription("Bans a user from the server").
    addUserOption(option =>
        option.setName("user")
            .setDescription("The user to ban")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("reason")
            .setDescription("The reason for the ban")
            .setRequired(false))
    .toJSON();

export const BanCommand = async (interaction: ChatInputCommandInteraction, client: Client) => {
    try {
        const { guild, member } = interaction;

        if (!guild || !member) return interaction.reply('This command can only be used in server channels.');

        if (!(member instanceof GuildMember)) return interaction.reply('API Integration not implemented for this command.');

        if (!interaction.memberPermissions?.has('BanMembers')) return interaction.reply('You do not have permission to ban members.');

        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', false) || 'No reason provided';

        if (user.id == member.user.id) return interaction.reply('You cannot ban yourself.');

        if (user.id == guild.ownerId) return interaction.reply('You cannot ban the server owner.');

        const memberToBan = await guild.members.fetch(user.id);

        if (!memberToBan) return interaction.reply('User not found.');

        if (member.roles.highest.comparePositionTo(memberToBan.roles.highest) <= 0 && guild.ownerId !== member.user.id) return interaction.reply('You cannot ban this user.');

        await memberToBan.send(`You have been banned from the server ${guild.name}. Reason: ${reason}`).catch(() => console.error);

        memberToBan.ban({ reason }).then(() => {
            interaction.reply(`User ${user.toString()} has been banned from the server.`)

            client.info(guild.id, `${member.toString()} banned ${user.toString()} from the server.\nReason: ${reason}`);
        });

    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to ban the user.');
    } finally {
        setTimeout(() => interaction.deleteReply(), 5000)
    }
}