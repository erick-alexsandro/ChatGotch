const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editpet")
    .setDescription("Edit name, father, mother. (Only for your pets!)")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of the pet.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("What on your pet would you like to edit.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("newvalue").setDescription("The new value of the item.")
    ),
  async execute(interaction) {
    const parent = `<@${interaction.user.id}>`;
    const petName = interaction.options.getString("nameofpet");
    const petItem = interaction.options.getString("item");
    const newValue = interaction.options.getString("newvalue");

    const pet = await Pet.findOne({
      $or: [{ mother: parent }, { father: parent }],
      name: { $regex: new RegExp(petName, "i") },
    });

    if (!pet) {
      return interaction.reply(`There's no pet named: **${petName}**`);
    }

    if (
      petItem === "lifeCount" ||
      petItem === "dead" ||
      petItem === "birthDate"
    ) {
      return interaction.reply(
        `You cannot edit ${petItem}. You slick bastard!`
      );
    }

    try {
      pet[petItem] = newValue;
      await pet.save();
      return interaction.reply(
        `Pet named '${petName}' was edited successfully.`
      );
    } catch (error) {
      console.error(error);
      return interaction.reply(
        `Something went wrong with editing pet: ${petName}`
      );
    }
  },
};
