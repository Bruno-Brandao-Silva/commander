import { ChatInputCommandInteraction, GuildMemberRoleManager, SlashCommandBuilder } from "discord.js";
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

        if (!interaction.memberPermissions?.has('BanMembers')) return interaction.reply('You do not have permission to ban members.');

        const user = interaction.options.getUser('user')!;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (user.id == member.user.id) return interaction.reply('You cannot ban yourself.');

        const memberToBan = await guild.members.fetch(user.id);

        if (!memberToBan) return interaction.reply('User not found.');

        if (member.roles instanceof GuildMemberRoleManager && member.roles.highest.comparePositionTo(memberToBan.roles.highest) <= 0) return interaction.reply('You cannot ban this user.');

        memberToBan.ban({ reason }).then(() => {

            interaction.reply(`User ${user.toString()} has been banned from the server.`)
                .then(msg => setTimeout(() => msg.delete(), 5000));

            client.info(guild.id, `${member.toString()} banned ${user.toString()} from the server. Reason: ${reason}`);

        });

    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to ban the user.');
    }
}