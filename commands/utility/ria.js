const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ria')
        .setDescription('Ri da cara de um palhaço!'),
    async execute(interaction) {
        await interaction.reply({content: 'HAHAHAHA!', ephemeral: true});
    },
}