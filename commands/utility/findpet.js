const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("findpet")
    .setDescription("Find a pet.")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of the pet.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const petName = interaction.options.getString("nameofpet");
    const pet = await Pet.findOne({
      name: { $regex: new RegExp(petName, "i") },
    });

    if (!pet) {
      return interaction.reply(`Could not find pet: ${petName}`);
    }

    try {
      const petEmbed = new EmbedBuilder()
        .setColor(pet.dead ? 0xff0000 : 0x00ff00)
        .setTitle(pet.name)
        .setDescription(
          pet.mother === pet.father
            ? `This creature was born on ${pet.birthDate} by ${pet.mother}`
            : `This creature was born on ${pet.birthDate} by ${pet.mother} and ${pet.father}`
        )
        .addFields(
          { name: "Birthdate:", value: pet.birthDate },
          {
            name: "Parents:",
            value:
              pet.mother == pet.father
                ? `${pet.mother}`
                : `${pet.mother} and ${pet.father}`,
          },
          { name: "Life Count:", value: `**${pet.lifeCount}**` }
        )
        .setImage(pet.devoured ? "https://i.imgur.com/cAp8nPJ.png" : pet.image)
        .setTimestamp();

      return interaction.reply({ embeds: [petEmbed] });
    } catch (error) {
      console.error(error); // Add this line for debugging
      return interaction.reply(`Could not find pet: ${petName}`);
    }
  },
};
