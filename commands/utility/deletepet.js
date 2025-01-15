const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletepet")
    .setDescription("Delete a pet.")
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

    if (pet) {
      if (
        `<@${interaction.user.id}>` == pet.mother ||
        `<@${interaction.user.id}>` == pet.father
      ) {
        await Pet.deleteOne({ name: { $regex: new RegExp(petName, "i") } });
        return interaction.reply(
          `Pet named '${petName}' was deleted successfully.`
        );
      } else {
        return interaction.reply("You are not the owner of this pet.");
      }
    } else {
      return interaction.reply(`Could not find pet: ${petName}`);
    }
  },
};
