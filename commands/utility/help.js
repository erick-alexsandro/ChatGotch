const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Calm down, babe! ;) The bot will explain everything for you!'),
    async execute(interaction) {
        await interaction.reply({content: 'https://chat-gotch-3.onrender.com (All the commands and explanations can be found here)', ephemeral: true});
    },
}