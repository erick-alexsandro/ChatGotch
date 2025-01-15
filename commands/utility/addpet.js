const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addpet")
    .setDescription("Give birth to a pet.")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of the pet.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("datebirth")
        .setDescription("IMPORTANT! Follow this format: DD/MM/YYYY.")
        .setRequired(true)
    )
    .addMentionableOption((option) =>
      option.setName("father").setDescription("The username of the father.")
    )
    .addAttachmentOption((option) =>
      option.setName("image").setDescription("The image of the pet.")
    ),
  async execute(interaction) {
    const petName = interaction.options.getString("nameofpet");
    const petFather = interaction.options.getMentionable("father")
      ? interaction.options.getMentionable("father").toString()
      : `<@${interaction.user.id}>`;
    const petDateBirth = interaction.options.getString("datebirth");
    const image = interaction.options.getAttachment("image")?.url;

    try {
      const pet = new Pet({
        name: petName,
        father: petFather,
        mother: `<@${interaction.user.id}>`,
        birthDate: petDateBirth,
        image: image,
        lifeCount: `<@${interaction.user.id}>` == petFather ? 6 : 3,
      });

      await pet.save();

      const petEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(pet.name)
        .setDescription(
          pet.mother == pet.father
            ? `This creature was born on ${pet.birthDate} by ${pet.mother}`
            : `This creature was born on ${pet.birthDate} by ${pet.mother} and ${pet.father}`
        )
        .addFields(
          { name: "Birthdate:", value: `${pet.birthDate}` },
          {
            name: "Parents:",
            value:
              pet.mother == pet.father
                ? `${pet.mother}`
                : `${pet.mother} and ${pet.father}`,
          },
          { name: "Life Count:", value: `**${pet.lifeCount}**` }
        )
        .setImage(pet.image)
        .setTimestamp();

      return interaction.reply({ embeds: [petEmbed] });
    } catch (error) {
      if (error.code === 11000) {
        return interaction.reply("That pet already exists.");
      }

      return interaction.reply("Something went wrong with adding the pet.");
    }
  },
};
