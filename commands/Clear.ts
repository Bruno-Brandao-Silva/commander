import { AttachmentBuilder, ChannelType, ChatInputCommandInteraction, Collection, Message, PartialMessage, SlashCommandBuilder } from "discord.js";
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

        if (isNaN(amount) || amount <= 0) {
            return interaction.reply('Please provide a valid amount of messages to clear.');
        }

        const forLimiter = amount % 100;
        const rest = amount - forLimiter * 100;

        const deletedMessages: Collection<string, PartialMessage | Message<boolean> | undefined>[] = [];
        
        let overloadPrevent: boolean = false;
        let size = 0;

        for (let i = 0; i < forLimiter; i++) {
            const _deletedMessages = await channel.bulkDelete(100, true);
            deletedMessages.push(_deletedMessages);
            size += _deletedMessages.size;
            if (_deletedMessages.size != 100) {
                overloadPrevent = true;
                break;
            }
        }

        if (!overloadPrevent) {
            const _deletedMessages = await channel.bulkDelete(rest, true);
            deletedMessages.push(_deletedMessages);
            size += _deletedMessages.size;
        }

        const attachment = new AttachmentBuilder(
            new Readable({
                read() {
                    this.push(`Deleted by: ${member.toString()} [${member.user.username}] at ${new Date().formatDate()}\n\n`);
                    this.push('Deleted Messages:\n\n');
                    this.push(`<UserId> [Username] [DisplayName] at [CreateDate][EditedDate]: Content\n\n`);
                    this.push(deletedMessages
                        .reverse()
                        .map(_deletedMessages => _deletedMessages
                            .reverse()
                            .map(msg => msg && `${msg.author!.toString()} [${msg.author!.username}] [${msg.author!.displayName}] at [${new Date(msg.createdTimestamp).formatDate()}][${msg.editedTimestamp ? `${new Date(msg.editedTimestamp).formatDate()}` : ''}]: ${msg.content}`)
                            .join('\n')
                        ).join('\n'));
                    this.push(null);
                }
            }),
            { name: 'deletedMessages.txt' }
        );

        await interaction.reply(`Hey ${member.toString()}, I have cleared ${size} messages for you!`)

        client.info(guildId, `${member.toString()} cleared ${size} messages in ${channel.toString()}`, [attachment]);
    } catch (error) {
        console.error(error);
        interaction.reply('There was an error while trying to clear messages.');
    } finally {
        setTimeout(() => interaction.deleteReply(), 5000)
    }
};
