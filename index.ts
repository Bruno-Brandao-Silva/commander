import 'dotenv/config'
import { ChannelType, Events, GatewayIntentBits, GuildMember, Message, TextChannel, REST, Routes, SlashCommandBuilder } from 'discord.js';
import mongoose from 'mongoose';
import SpanDetector from './controllers/SpanControl';
import Server from './models/Server';
import User from './models/User';
import Classifier from './controllers/Classifier';
import Client from './models/Client';
import { ClearCommand, ClearCommandJSON } from './commands/Clear';
import './lib/utils';
import { BanCommand, BanCommandJSON } from './commands/Ban';
import { KickCommand, KickCommandJSON } from './commands/Kick';

const { TOKEN, CLIENT_ID, MONGODB_URI, LOG_CHANNEL } = process.env;

if (!TOKEN || !CLIENT_ID || !MONGODB_URI || !LOG_CHANNEL) throw new Error('Variáveis de ambiente não definidas.');

const intents = Object.keys(GatewayIntentBits).map((a: string) => {
    return GatewayIntentBits[a as keyof typeof GatewayIntentBits];
});

const client = new Client({ intents: intents });

const prefix = '!';

client.once(Events.ClientReady, () => {
    client.guilds.cache.forEach(guild => {
        console.log(guild.name);
        const logChannel = guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.name === LOG_CHANNEL)
        if (logChannel) {
            client.setLogChannel(guild.id, logChannel.id);
        } else {
            guild.channels.create({
                name: LOG_CHANNEL,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: ['ViewChannel'],
                    },
                ],
            }).then(channel => {
                client.setLogChannel(guild.id, channel.id);
            });
        }
    });
    console.log('Bot is online!');
});

client.on(Events.GuildAuditLogEntryCreate, (entry) => {
    console.log("GuildAuditLogEntryCreate", entry);
});

client.on(Events.GuildCreate, async (guild) => {
    try {
        console.log(`Joined a new guild: ${guild.name} (ID: ${guild.id})`);
        client.info(guild.id, `Joined a new guild: ${guild.name} (ID: ${guild.id})`);
        Server.findOne({ id: guild.id }).then(async (existingServer) => {
            if (!existingServer) {
                const newServer = new Server({
                    id: guild.id,
                    name: guild.name,
                    icon: guild.iconURL(),
                    features: guild.features,
                    members: guild.members.cache.map(member => member.id),
                    channels: guild.channels.cache.map(channel => channel.id),
                    roles: guild.roles.cache.map(role => role.id),
                    ownerID: guild.ownerId,
                    emojis: guild.emojis.cache.map(emoji => emoji.id),
                    stickers: guild.stickers.cache.map(sticker => sticker.id),
                    createdTimestamp: guild.createdTimestamp,
                    iconURL: guild.iconURL(),
                    shardId: guild.shardId,
                    nameAcronym: guild.nameAcronym,
                });
                await newServer.save();
            }
        });
        // Adiciona dados dos membros ao MongoDB
        guild.members.fetch().then(users => {
            const getUsers = users.map(user => {
                if (user.user.bot) return;
                return User.findOne({ id: user.id }).then((existingUser) => {
                    if (!existingUser) {
                        const newUser = new User({
                            id: user.id,
                            username: user.user.username,
                            discriminator: user.user.discriminator,
                            avatar: user.user.avatar,
                            createdTimestamp: user.user.createdTimestamp,
                            defaultAvatarURL: user.user.defaultAvatarURL,
                            tag: user.user.tag,
                            avatarURL: user.user.avatarURL(),
                            displayAvatarURL: user.user.displayAvatarURL(),
                        });
                        return newUser;
                    }
                });
            });
            Promise.allSettled(getUsers).then((results) => {
                User.insertMany(results.map(result => result.status == 'fulfilled' && result.value).filter(Boolean));
            });
        });

    } catch (error) {
        console.error('Error during guild create event:', error);
    }
});


client.on(Events.GuildDelete, (guild) => {
    console.log(`Left a guild: ${guild.name} (ID: ${guild.id})`);
});
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {

});


client.on(Events.GuildMemberAdd, (member) => {
    const welcomeChannel: TextChannel | null = member.guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.name === 'welcome')! as TextChannel;
    if (welcomeChannel) {
        welcomeChannel.send(`Welcome to the server, ${member.user.toString()}!`);
    }
});

client.on(Events.GuildMemberRemove, (member) => {
    const goodbyeChannel: TextChannel | null = member.guild.channels.cache.find(channel => channel.type === ChannelType.GuildText && channel.name === 'goodbye')! as TextChannel;
    if (goodbyeChannel) {
        goodbyeChannel.send(`Goodbye, ${member.user.toString()}!`);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {

    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (interaction.isChatInputCommand()) {
        if (commandName === 'clear') {
            await ClearCommand(interaction, client);
        } else if (commandName === 'kick') {
            await KickCommand(interaction, client);
        } else if (commandName === 'ban') {
            await BanCommand(interaction, client);
        }
    } else {
        if (commandName === 'ping') {
            await interaction.reply('Pong!');
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    checkAntiRaid(message);

    // console.log(message.content, Classifier.classifyText(message.content));
    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        if (command === 'ban') {
            if (!message.member?.permissions.has('BanMembers')) return message.reply('You do not have permission to use this command.');

            const member: GuildMember | undefined = message.mentions.members?.first();
            if (!member) return message.reply('Please mention a valid member of this server.');

            const reason: string = args.join(' ');
            if (!reason) return message.reply('Please provide a reason for banning this member.');

            member.ban({ reason })
                .then(() => message.reply(`${member.user.tag} has been banned.`))
                .catch(error => message.reply(`An error occurred while trying to ban ${member.user.tag}: ${error.message}`));
        }
    };
});

async function checkAntiRaid(message: Message) {
    const { content, member, channel } = message;

    if (!member || member.user.bot || member.permissions.has('ManageMessages')) return;
    SpanDetector(message);
}

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB');
    //may we load some data from the database here?


    // await Classifier.loadModel();
    // console.log(Classifier.classifyText('I love this game!'));
    // console.log(Classifier.classifyText('What a beautiful day!'));



    client.login(TOKEN)
        .catch(console.error);
}).catch(console.error);

const pingCommand = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')
const boopCommand = new SlashCommandBuilder()
    .setName('boop')
    .setDescription('Boops the specified user, as many times as you want')
    .addUserOption((option) => option.setName('user').setDescription('The user to boop').setRequired(true))

    // Adds an integer option
    .addIntegerOption((option) =>
        option.setName('boop_amount').setDescription('How many times should the user be booped (defaults to 1)'),
    )

    // Supports choices too!
    .addIntegerOption((option) =>
        option
            .setName('boop_reminder')
            .setDescription('How often should we remind you to boop the user')
            .addChoices({ name: 'Every day', value: 1 }, { name: 'Weekly', value: 7 }),
    );
const pointsCommand = new SlashCommandBuilder()
    .setName('points')
    .setDescription('Lists or manages user points')

    // Add a manage group
    .addSubcommandGroup((group) =>
        group
            .setName('manage')
            .setDescription('Shows or manages points in the server')
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('user_points')
                    .setDescription("Alters a user's points")
                    .addUserOption((option) =>
                        option.setName('user').setDescription('The user whose points to alter').setRequired(true),
                    )
                    .addStringOption((option) =>
                        option
                            .setName('action')
                            .setDescription('What action should be taken with the users points?')
                            .addChoices(
                                { name: 'Add points', value: 'add' },
                                { name: 'Remove points', value: 'remove' },
                                { name: 'Reset points', value: 'reset' },
                            )
                            .setRequired(true),
                    )
                    .addIntegerOption((option) => option.setName('points').setDescription('Points to add or remove')),
            ),
    )

    // Add an information group
    .addSubcommandGroup((group) =>
        group
            .setName('info')
            .setDescription('Shows information about points in the guild')
            .addSubcommand((subcommand) =>
                subcommand.setName('total').setDescription('Tells you the total amount of points given in the guild'),
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName('user')
                    .setDescription("Lists a user's points")
                    .addUserOption((option) =>
                        option.setName('user').setDescription('The user whose points to list').setRequired(true),
                    ),
            ),
    );


const setCommands = () => {
    const commands = [
        pingCommand.toJSON(),
        pointsCommand.toJSON(),
        boopCommand.toJSON(),
        ClearCommandJSON,
        BanCommandJSON,
        KickCommandJSON
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    console.log('Started refreshing application (/) commands.');


    rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }).then(() =>
        console.log('Successfully reloaded application (/) commands.')).catch(console.error);

}