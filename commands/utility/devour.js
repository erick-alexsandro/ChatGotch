const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

const Pet = require('../../Schemas/PetSchema');

mongoose.connect(process.env.mongoDbUrl)

module.exports = {
  data: new SlashCommandBuilder()
    .setName("devour")
    .setDescription("Devour a dead pet.")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of YOUR pet. The one who's gonna devour.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("victim")
        .setDescription("The name of the pet who will be devoured.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const victim = interaction.options.getString("victim");
    const hungryPet = interaction.options.getString("nameofpet");
    const pet = await Pet.findOne({
      name: { $regex: new RegExp(victim, "i") },
    });
    const monster = await Pet.findOne({
      name: { $regex: new RegExp(hungryPet, "i") },
    });

    if (!pet) {
      return interaction.reply(`Could not find pet: ${victim}`);
    } else if (!monster) {
      return interaction.reply(`Could not find pet: ${hungryPet}`);
    }
    try {
      if (
        monster.mother == `<@${interaction.user.id}>` ||
        monster.father == `<@${interaction.user.id}>`
      ) {
        if (pet.dead) {
          if (!pet.devoured) {
            if (monster.name != pet.name && !monster.dead) {
              pet.devoured = true;
              await pet.save();
              monster.lifeCount += 1;
              await monster.save();

              const petEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle("**GET OWNED!** 😂👅")
                .setDescription(
                  `${pet.name} was devoured by ${monster.name}. ${monster.name} has now a life count of ${monster.lifeCount}!`
                )
                .setImage("https://i.imgur.com/2w4oYje.png")
                .setTimestamp();

              return interaction.reply({ embeds: [petEmbed] });
            } else {
              return interaction.reply(`Something went wrong.`);
            }
          } else {
            return interaction.reply(`That pet has already been devoured.`);
          }
        } else {
          return interaction.reply(`That pet is not dead.`);
        }
      } else {
        return interaction.reply(
          `You are only allowed to make your pets devour each other.`
        );
      }
    } catch (error) {
      console.error(error); // Add this line for debugging
      return interaction.reply(
        `Something went wrong with devouring the pet. Tag me (Oii genteee) if you see this.`
      );
    }
  },
};
