import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Client from "../models/Client";
import { Readable } from "stream";

export const ClearCommandJSON = new SlashCommandBuilder().
    setName("clear").
    setDescription("Clears messages from a channel").
    addIntegerOption(option =>
        option.setName("amount")
            .setDescription("The amount of messages to clear")
            .setRequired(true))
    .toJSON();

export const ClearCommand = async (interaction: ChatInputCommandInteraction, client: Client) => {
    try {

        const { channel, guildId, member } = interaction;

        if (!channel || channel.type == ChannelType.DM || !guildId || !member) return interaction.reply('This command can only be used in server channels.');

        if (!interaction.memberPermissions?.has('ManageMessages')) return interaction.reply('You do not have permission to clear messages.');

        const amount = interaction.options.getInteger('amount')!;

        if (isNaN(amount) || amount <= 0 || amount > 99) {
            return interaction.reply('Please provide a number between 1 and 99 to clear messages.');
        }

        const deletedMessages = await channel.bulkDelete(amount + 1, true);
        await interaction.reply(`Hey ${member.toString()}, I have cleared ${deletedMessages.size} messages for you!`)
            .then((msg) => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        const files: [{ name: string, attachment: Readable }] = [{
            name: 'deletedMessages.txt',
            attachment: new Readable({
                read() {
                    this.push(`Deleted by: ${member.toString()} [${member.user.username}] at ${new Date().formatDate()}\n\n`);
                    this.push('Deleted Messages:\n\n');
                    this.push(`<UserId> [Username] [DisplayName] at [CreateDate][EditedDate]: Content\n\n`);
                    this.push(deletedMessages.reverse().map(msg => msg && `${msg.author!.toString()} [${msg.author!.username}] [${msg.author!.displayName}] at [${new Date(msg.createdTimestamp).formatDate()}][${msg.editedTimestamp ? `${new Date(msg.editedTimestamp).formatDate()}` : ''}]: ${msg.content}`).join('\n'));
                    this.push(null);
                }
            })
        }];
        client.info(guildId, `${member.toString()} cleared ${deletedMessages.size} messages in ${channel.toString()}`, files);
    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to clear messages.');
    }
};
