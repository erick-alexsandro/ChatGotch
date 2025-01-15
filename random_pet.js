const mongoose = require("mongoose");
const { EmbedBuilder } = require("discord.js");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const express = require("express");
require("dotenv").config();

const Pet = require("./Schemas/PetSchema");
const Counters = require("./Schemas/CountersSchema");

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
  
  function generateRandomTimes() {
    const times = [];
    for (let i = 0; i < 3; i++) {
      const hours = Math.floor(Math.random() * 24);
      const minutes = Math.floor(Math.random() * 60);
      times.push(new Date(new Date().setHours(hours, minutes, 0, 0)));
    }
    return times.sort((a, b) => a - b);
  }

  function generateRandomTime() {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return new Date(new Date().setHours(hours, minutes, 0, 0));
  }
  
  async function resetDailyCounter() {
    const counters = await Counters.findOneAndUpdate(
      {
        dailyRunCount: 0,
        lastReset: new Date().setHours(3, 0, 0, 0),
        eventTimes: generateRandomTimes(),
      },
      { upsert: true, new: true }
    );
    return counters;
  }
  
  async function checkTimeAndSendMessage() {
    const now = new Date();
    let counters = await Counters.findOne();
  
    if (!counters || now.getDate() !== counters.lastReset.getDate()) {
      await resetDailyCounter();
    }
  
    if (counters.dailyRunCount < 3) {
      const nextEventTime = counters.eventTimes[counters.dailyRunCount];
  
      if (now >= nextEventTime) {
        let randomPet = await logRandomPet();
  
        while (randomPet.dead === true || randomPet.secured === true) {
          randomPet = await logRandomPet();
        }

        const petEmbed = new EmbedBuilder()
          .setColor(0xffff00)
          .setTitle(`HUNGER HAS COME TO - ${randomPet.name}.`)
          .addFields({
            name: "FEED IT NOW OR IT WILL DIE:",
            value:
              "To feed it, react with 🍼 (You must be one of the parents to feed it!)",
          })
          .setImage(randomPet.image)
          .setTimestamp();
  
        const channel = client.channels.cache.get("1118581603468324944");
        if (channel) {
          const message = await channel.send({
            content:
              randomPet.mother == randomPet.father
                ? `Parent of this poor child: ${randomPet.mother}`
                : `Parents of this poor child: ${randomPet.mother} and ${randomPet.father}`,
            embeds: [petEmbed],
          });
          await message.react("🍼");
  
          const filter = (reaction, user) =>
            reaction.emoji.name === "🍼" &&
            !user.bot &&
            (`<@${user.id}>` === randomPet.mother ||
              `<@${user.id}>` === randomPet.father);
  
          const collector = message.createReactionCollector({
            filter,
            time: 180000,
          });
  
          collector.on("collect", (reaction, user) => {
            channel.send(`Thank you for feeding ${randomPet.name}, ${user.tag}!`);
            collector.stop("fed");
          });
  
          collector.on("end", (collected, reason) => {
            if (reason !== "fed") {
              channel.send(
                `**${randomPet.name}** was not fed in time and lost a life count.`
              );
              randomPet.lifeCount -= 1;
  
              if (randomPet.lifeCount == 0) {
                let sadImage = `https://cdn.prod.website-files.com/646218c67da47160c64a84d5/646342ac52ad093eec746d55_30.png`;
                channel.send({
                  files: [
                    {
                      attachment: sadImage,
                      name: "sad.png",
                    },
                  ],
                  content: `**${randomPet.name}** has died. :( `,
                });
                randomPet.dead = true;
              }
              randomPet.save();
            }
          });
          counters.dailyRunCount++;
          await counters.save();
          if (counters.dailyRunCount >= 3) {
            counters.eventTimes = generateRandomTimes();
            await counters.save();
          }
        }
      }
    }
  }

  module.exports = { checkTimeAndSendMessage };