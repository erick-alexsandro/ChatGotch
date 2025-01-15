const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

const Pet = require("../../Schemas/PetSchema");

mongoose.connect(process.env.mongoDbUrl);

const PETS_PER_PAGE = 10;

async function getPaginatedPets(page) {
  const pets = await Pet.find({}).sort({ lifeCount: -1 });
  const start = (page - 1) * PETS_PER_PAGE;
  return pets.slice(start, start + PETS_PER_PAGE);
}

function createPetEmbed(pets, page, totalPages) {
  const maxNameLength = Math.max(...pets.map((pet) => pet.name.length));
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`Pets (Page ${page}/${totalPages})`)
    .addFields({
      name: "Pets:",
      value: pets
        .map((pet) =>
          pet.dead
            ? `~~ ${pet.name.padEnd(maxNameLength + 2)}~~`
            : `\`${pet.name.padEnd(maxNameLength + 2)}${pet.lifeCount}\``
        )
        .join("\n"),
    })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("findallpets")
    .setDescription("Find all pets."),
  async execute(interaction) {
    try {
      const totalPets = await Pet.countDocuments();
      const totalPages = Math.ceil(totalPets / PETS_PER_PAGE);
      let currentPage = 1;

      const paginatedPets = await getPaginatedPets(currentPage);
      const embed = createPetEmbed(paginatedPets, currentPage, totalPages);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
      );

      const response = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      const collector = response.createMessageComponentCollector({
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "prev" && currentPage > 1) {
          currentPage--;
        } else if (i.customId === "next" && currentPage < totalPages) {
          currentPage++;
        }

        const newPaginatedPets = await getPaginatedPets(currentPage);
        const newEmbed = createPetEmbed(newPaginatedPets, currentPage, totalPages);
        await i.update({ embeds: [newEmbed], components: [row] });
      });
    } catch (error) {
      console.error("Error in findallpets command:", error);
      return interaction.reply(`Could not find pets! Error: ${error.message}`);
    }
  },
};
