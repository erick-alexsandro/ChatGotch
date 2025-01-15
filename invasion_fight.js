const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const Pet = require("./Schemas/PetSchema");
const Counters = require("./Schemas/CountersSchema");

require("dotenv").config();

mongoose.connect(process.env.mongoDbUrl);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.token);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

async function logRandomPet() {
  const randomPet = await Pet.aggregate([{ $sample: { size: 1 } }]).exec();

  if (randomPet.length > 0) {
    return await Pet.findById(randomPet[0]._id);
  }
  return null;
}

function generateRandomTime() {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  return new Date(new Date().setHours(hours, minutes, 0, 0));
}

async function resetDailyCounter() {
  const counters = await Counters.findOneAndUpdate(
    {
      invasionDay: Math.floor(Math.random() * 3) == 2 ? true : false,
      invasionTime: generateRandomTime(),
    },
    { upsert: true, new: true }
  );
  return counters;
}

async function checkTimeAndSendInvasion(interaction) {
  const now = new Date();
  let counters = await Counters.findOne();

  if (!counters || now.getDate() !== counters.lastReset.getDate()) {
    await resetDailyCounter();
  }
  if (counters.invasionDay) {
    
    if (counters.invasionTime <= new Date()) {
      let pet = await logRandomPet();
      while (pet.dead == true || pet.secured == true) {
        pet = await logRandomPet();
      }
      if (pet.dead == false) {
        const petEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(`**${pet.name} has been challenged by an invader!**`)
          .addFields({
            name: `${pet.name} needs to fight this invader, or it will loose one life!`,
            value: "To accept the challenge, react with 👊.",
          })
          .setImage("https://i.imgur.com/xaDMzk4.gif")
          .setTimestamp();
        const channel = client.channels.cache.get("1118581603468324944");
        const message = await channel.send({
          content:
            pet.mother == pet.father
              ? `**${pet.mother} - Your pet has been challenged by an invader!**`
              : `**${pet.mother} and ${pet.father} - Your pet have been challenged by an invader!**`,
          embeds: [petEmbed],
          fetchReply: true,
        });
        await message.react("👊");

        const filterAccepted = (reaction, user) =>
          reaction.emoji.name === "👊" &&
          !user.bot &&
          (`<@${user.id}>` === pet.mother || `<@${user.id}>` === pet.father);

        const collector = message.createReactionCollector({
          filter: filterAccepted,
          time: 300000,
        });

        const collectorTimeout = message.createReactionCollector({
          time: 300000,
        });

        let fightResolved = false;

        collector.on("collect", async (reaction, user) => {
          if (fightResolved) return;
          fightResolved = true;

          let winnerNumber = Math.floor(Math.random() * 2) + 1;
          let winner;
          if (winnerNumber == 1) {
            pet.lifeCount += 1;
            await pet.save();
            winner = pet.name;
          } else {
            pet.lifeCount -= 1;
            if (pet.lifeCount == 0) pet.dead = true;
            await pet.save();
            winner = "Invader";
          }

          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle(`**${winner} won the fight!**`)
                .setImage(
                  winner === pet.name
                    ? pet.image
                    : "https://i.imgur.com/x81upXg.gif"
                )
                .setTimestamp(),
            ],
          });
          collector.stop();
        });

        collectorTimeout.on("end", async (collected, reason) => {
          if (reason === "time" && !fightResolved) {
            fightResolved = true;
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xff0000)
                  .setTitle(
                    `**The fight request has timed out. No response was received. Therefore, the invader has won the fight.**`
                  )
                  .setImage("https://i.imgur.com/x81upXg.gif")
                  .setTimestamp(),
              ],
            });

            pet.lifeCount -= 1;
            await pet.save();
            collector.stop();
          }
        });
      }
    }
    counters.invasionDay = false;
    await counters.save();
  }
}

module.exports = { checkTimeAndSendInvasion };
