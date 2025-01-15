const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editimage")
    .setDescription("Edit a pet's image")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of the pet")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("The new image for the pet")
        .setRequired(true)
    ),
  async execute(interaction) {
    const petName = interaction.options.getString("nameofpet");
    const newImage = interaction.options.getAttachment("image");

    if (!newImage) {
      return interaction.reply(`Please provide an image.`);
    }

    const pet = await Pet.findOne({
      name: { $regex: new RegExp(petName, "i") },
    });
    if (!pet) {
      return interaction.reply(`Could not find pet: ${petName}`);
    }

    const parentId = interaction.user.id;
    if (pet.mother !== `<@${parentId}>` || pet.father !== `<@${parentId}>`) {
      return interaction.reply(`You are not allowed to edit this pet.`);
    }

    pet.image = newImage.url;
    await pet.save();
    return interaction.reply(`Pet's image was edited successfully.`);
  },
};
