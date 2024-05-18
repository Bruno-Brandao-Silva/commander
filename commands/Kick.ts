import { ChatInputCommandInteraction, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";
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

        if (!interaction.memberPermissions?.has('KickMembers')) return interaction.reply('You do not have permission to kick members.');

        const user = interaction.options.getUser('user')!;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (user.id == member.user.id) return interaction.reply('You cannot kick yourself.');

        const memberToKick = await guild.members.fetch(user.id);

        if (!memberToKick) return interaction.reply('User not found.');

        if (member.roles instanceof GuildMemberRoleManager && member.roles.highest.comparePositionTo(memberToKick.roles.highest) <= 0) return interaction.reply('You cannot kick this user.');

        memberToKick.kick(reason).then(() => {

            interaction.reply(`User ${user.toString()} has been kicked from the server.`)
                .then(msg => setTimeout(() => msg.delete(), 5000));

            client.info(guild.id, `${member.toString()} kicked ${user.toString()} from the server. Reason: ${reason}`);

        });

    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to kick the user.');
    }
}