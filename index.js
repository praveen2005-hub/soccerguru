require("dotenv").config()
const { Client } = require("discord.js-selfbot-v13")

const TARGET_SERVERS = new Set([process.env.TARGET_SERVER_ID])
const TARGET_CHANNEL_NAME = process.env.TARGET_CHANNEL_NAME
const MESSAGE_POOL = ["<@668075833780469772> claim"]

const accounts = [
  { token: process.env.DISCORD_TOKEN, cooldown: [3600000, 4300000] }
]

const random = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const now = () => new Date().toLocaleString()

const findTargetChannels = async c => {
  const out = []
  for (const g of c.guilds.cache.values()) {
    if (!TARGET_SERVERS.has(g.id)) continue
    const ch = g.channels.cache.find(
      x => x.name === TARGET_CHANNEL_NAME && x.type === "GUILD_TEXT"
    )
    if (ch) out.push(ch)
  }
  return out
}

accounts.forEach((acc, i) => {
  const client = new Client({ checkUpdate: false })

  client.once("ready", async () => {
    client.user.setStatus("invisible")
    console.log(`[${now()}] Logged in as ${client.user.username}`)

    const channels = await findTargetChannels(client)
    if (!channels.length) return

    const loop = async () => {
      const ch = channels[Math.floor(Math.random() * channels.length)]
      const msg = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)]
      try {
        await ch.sendTyping()
        setTimeout(async () => {
          await ch.send(msg)
          console.log(
            `[${now()}]  | ${msg}`
          )
        }, random(1000, 4000))
      } catch {}
      setTimeout(loop, random(...acc.cooldown))
    }

    setTimeout(loop, i * 60000)
  })

  client.login(acc.token)
})
