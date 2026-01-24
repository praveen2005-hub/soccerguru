const { Client } = require("discord.js-selfbot-v13");

/* ================= CONFIG ================= */

const TARGET_SERVERS = new Set([
  "1145428528360325140"
  ]);

const TARGET_CHANNEL_NAME = "soccer-guru";

/* ===== SHARED MESSAGE POOL ===== */

const MESSAGE_POOL = [
  "<@668075833780469772> claim"
];

/* ===== ACCOUNTS ===== */

const accounts = [
  {
    token: "MTMxMjg1MTE1MzIzMDQ5OTkyMQ.GULgIw.bdK2xwCNkVlMLepm92HlNMU5PZg-nIq1CYK9hc",
    cooldown: [3600000, 4300000]
  },
  
];

/* ========================================== */

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function findTargetChannels(client) {
  const channels = [];

  for (const guild of client.guilds.cache.values()) {
    if (!TARGET_SERVERS.has(guild.id)) continue;

    const channel = guild.channels.cache.find(
      c => c.name === TARGET_CHANNEL_NAME && c.type === "GUILD_TEXT"
    );

    if (channel) channels.push(channel);
  }

  return channels;
}

accounts.forEach((acc, index) => {
  const client = new Client({ checkUpdate: false });

  client.once("ready", async () => {
    client.user.setStatus("invisible");
    console.log(`[+] Logged in as ${client.user.username}`);

    const channels = await findTargetChannels(client);
    if (!channels.length) {
      console.log(`[!] No channels found for ${client.user.username}`);
      return;
    }

    async function sendLoop() {
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const msg = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)];

      try {
        await channel.sendTyping();
        setTimeout(async () => {
          await channel.send(msg);
          console.log(
            `[${client.user.username}] "${msg.replace(/\n/g, " / ")}" → ${channel.guild.name}`
          );
        }, random(1000, 4000));
      } catch {}

      setTimeout(sendLoop, random(acc.cooldown[0], acc.cooldown[1]));
    }

    // stagger startup
    setTimeout(sendLoop, index * 60000);
  });

  client.login(acc.token);
});
