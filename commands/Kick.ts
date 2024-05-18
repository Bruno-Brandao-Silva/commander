import { ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";
import Client from "../models/Client";

export const KickCommandJSON = new SlashCommandBuilder().
    setName("kick").
    setDescription("Kicks a user from the server").
    addUserOption(option =>
        option.setName("user")
            .setDescription("The user to kick")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("reason")
            .setDescription("The reason for the kick")
            .setRequired(false))
    .toJSON();

export const KickCommand = async (interaction: ChatInputCommandInteraction, client: Client) => {
    try {

        const { guild, member } = interaction;

        if (!guild || !member) return interaction.reply('This command can only be used in server channels.');

        if (!(member instanceof GuildMember)) return interaction.reply('API Integration not implemented for this command.');

        if (!interaction.memberPermissions?.has('KickMembers')) return interaction.reply('You do not have permission to kick members.');

        const user = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason', false) || 'No reason provided';

        if (user.id == member.user.id) return interaction.reply('You cannot kick yourself.');

        if (user.id == guild.ownerId) return interaction.reply('You cannot kick the server owner.');

        const memberToKick = await guild.members.fetch(user.id);

        if (!memberToKick) return interaction.reply('User not found.');

        if (member.roles.highest.comparePositionTo(memberToKick.roles.highest) <= 0 && guild.ownerId !== member.user.id) return interaction.reply('You cannot kick this user.');

        await memberToKick.send(`You have been kicked from the server ${guild.name}. Reason: ${reason}`).catch(() => console.error);

        memberToKick.kick(reason).then(() => {
            interaction.reply(`User ${user.toString()} has been kicked from the server.`)

            client.info(guild.id, `${member.toString()} kicked ${user.toString()} from the server. Reason: ${reason}`);
        });

    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to kick the user.');
    } finally {
        setTimeout(() => interaction.deleteReply(), 5000)
    }
}