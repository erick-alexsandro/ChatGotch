const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
require("dotenv").config();
const {
  AttachmentBuilder,
  Client,
  Events,
  GatewayIntentBits,
} = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const { createCanvas, Image } = require("@napi-rs/canvas");

const Pet = require("../../Schemas/PetSchema");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "profile") {
    // ...
  }
});

client.login(process.env.token);

mongoose.connect(process.env.mongoDbUrl);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fight")
    .setDescription("Fight another pet.")
    .addStringOption((option) =>
      option
        .setName("nameofpet")
        .setDescription("The name of YOUR pet.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("opponent")
        .setDescription("Pet you want to fight.")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const pet = interaction.options.getString("nameofpet");
    const opponent = interaction.options.getString("opponent");

    const pet1 = await Pet.findOne({
      name: { $regex: new RegExp(pet, "i") },
    });

    const pet2 = await Pet.findOne({
      name: { $regex: new RegExp(opponent, "i") },
    });

    if (!pet1 || !pet2) {
      return interaction.editReply(`Could not find pet: ${pet} or ${opponent}`);
    }
    if (pet1.dead || pet2.dead) {
      return interaction.editReply(`One of the pets is dead.`);
    }
    if (pet1.name === pet2.name) {
      return interaction.editReply(`Your pet can't fight itself.`);
    }
    if (pet1.mother === pet2.mother || pet1.father === pet2.father) {
      return interaction.editReply(
        `You can't make pets with one of the same parents fight.`
      );
    }

    if (
      pet1.mother == `<@${interaction.user.id}>` ||
      pet1.father == `<@${interaction.user.id}>`
    ) {
      const canvas = Canvas.createCanvas(700, 250);
      const context = canvas.getContext("2d");

      const background = await Canvas.loadImage('https://i.imgur.com/gyAoYiX.jpeg');

	// This uses the canvas dimensions to stretch the image onto the entire canvas
	    context.drawImage(background, 0, 0, canvas.width, canvas.height);

      const avatar = await Canvas.loadImage(pet1.image);
      context.drawImage(avatar, 25, 25, 200, 200);

      const versus = await Canvas.loadImage("https://i.imgur.com/8EJRcBA.png");
      context.drawImage(versus, 212, 40, 282.75, 176.75);

      const avatarOponnent = await Canvas.loadImage(pet2.image);
      context.drawImage(avatarOponnent, 475, 25, 200, 200);

      const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
        name: "profile-image.png",
      });

      const petEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`**${pet1.name} vs. ${pet2.name}**`)
        .addFields({
          name: `${interaction.user.username}'s pet challenges ${pet2.name} to a fight!`,
          value:
            "To accept the challenge, react with 👊. To decline it, react with ❌",
        })
        .setImage('attachment://profile-image.png')
        .setTimestamp();

      const message = await interaction.editReply({
        content:
          pet2.mother == pet2.father
            ? `**${interaction.user.username} challenges ${pet2.mother} to a fight!**`
            : `**${interaction.user.username} challenges ${pet2.mother} and ${pet2.father} to a fight!**`,
        embeds: [petEmbed],
        files: [attachment],
        fetchReply: true,
      });
      await message.react("👊");
      await message.react("❌");

      const filterAccepted = (reaction, user) =>
        reaction.emoji.name === "👊" &&
        !user.bot &&
        (`<@${user.id}>` === pet2.mother || `<@${user.id}>` === pet2.father);

      const filterDeclined = (reaction, user) =>
        reaction.emoji.name === "❌" &&
        !user.bot &&
        (`<@${user.id}>` === pet2.mother || `<@${user.id}>` === pet2.father);

      const collector = message.createReactionCollector({
        filter: filterAccepted,
        time: 180000,
      });

      const collector2 = message.createReactionCollector({
        filter: filterDeclined,
        time: 180000,
      });

      const collectorTimeout = message.createReactionCollector({
        time: 180000,
      });

      let fightResolved = false;

      collector.on("collect", async (reaction, user) => {
        if (fightResolved) return;
        fightResolved = true;

        let winnerNumber = Math.floor(Math.random() * 2) + 1;
        let winner;
        if (winnerNumber == 1) {
          pet1.lifeCount += 1;
          await pet1.save();
          pet2.lifeCount -= 1;
          if (pet2.lifeCount == 0) pet2.dead = true;
          await pet2.save();
          winner = pet1;
        } else {
          pet2.lifeCount += 1;
          await pet2.save();
          pet1.lifeCount -= 1;
          if (pet1.lifeCount == 0) pet1.dead = true;
          await pet1.save();
          winner = pet2;
        }

        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle(`**${winner.name} won the fight!**`)
              .setImage(winner.image)
              .setTimestamp(),
          ],
        });
        collector.stop();
        collector2.stop();
      });

      collector2.on("collect", async (reaction, user) => {
        if (fightResolved) return;
        fightResolved = true;

        await interaction.followUp(`The fight has been declined.`);
        collector.stop();
        collector2.stop();
      });

      collectorTimeout.on("end", async (collected, reason) => {
        if (reason === "time" && !fightResolved) {
          fightResolved = true;
          await interaction.followUp(
            "The fight request has timed out. No response was received."
          );
          collector.stop();
          collector2.stop();
        }
      });
    } else {
      await interaction.editReply(`You are not the owner of ${pet1.name}.`);
    }
  },
};
