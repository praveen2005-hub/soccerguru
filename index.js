require("dotenv").config()
const { Client } = require("discord.js-selfbot-v13")
const TARGET_SERVERS = new Set([process.env.TARGET_SERVER_ID])
const TARGET_CHANNEL_NAME = process.env.TARGET_CHANNEL_NAME
const MESSAGE_POOL = ["<@668075833780469772> claim"]
const accounts = [
  { token: process.env.DISCORD_TOKEN, cooldown: [3600000, 3900000] }
]
const SOCCER_GURU_ID = "668075833780469772"
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
  let targetChannelIds = new Set()
  let lastClaimTime = 0 // ← track when we last claimed

  client.once("ready", async () => {
    client.user.setStatus("invisible")
    console.log(`[${now()}] 🟢 Logged in`)

    const channels = await findTargetChannels(client)
    if (!channels.length) return console.log(`[${now()}] ❌ No target channels found`)

    targetChannelIds = new Set(channels.map(c => c.id))

    const loop = async () => {
      const ch = channels[Math.floor(Math.random() * channels.length)]
      const msg = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)]
      try {
        await ch.sendTyping()
        setTimeout(async () => {
          await ch.send(msg)
          lastClaimTime = Date.now() // ← stamp the claim
          console.log(`[${now()}] 📨 Claimed`)
        }, random(1000, 4000))
      } catch {}
      setTimeout(loop, random(...acc.cooldown))
    }

    setTimeout(loop, i * 60000)
  })

  client.on("messageCreate", async message => {
    try {
      if (message.author.id !== SOCCER_GURU_ID) return
      if (!targetChannelIds.has(message.channel.id)) return
      if (!message.embeds?.length) return

      // ← Only process if within 30 seconds of our claim
      if (Date.now() - lastClaimTime > 30000) return

      const embed = message.embeds[0]
      if (!embed.description) return

      const match = embed.description.match(/Sells for\s*-\s*`([\d,]+)`/i)
      if (!match) return

      const sellValue = parseInt(match[1].replace(/,/g, ""))

      if (sellValue >= 6000) {
        console.log(`[${now()}] 💰 Sell value: ${sellValue.toLocaleString()} — keeping`)
        return
      }

      console.log(`[${now()}] 💸 Sell value: ${sellValue.toLocaleString()} — rerolling...`)

      setTimeout(async () => {
        try {
          const freshMessage = await message.channel.messages.fetch(message.id)
          const rows = freshMessage.components
          if (!rows?.length) return

          let rerollBtn = null
          for (const row of rows) {
            for (const btn of row.components) {
              if (btn.label?.toLowerCase().includes("re-roll") || btn.label?.toLowerCase().includes("reroll")) {
                rerollBtn = btn
                break
              }
            }
            if (rerollBtn) break
          }

          if (!rerollBtn) rerollBtn = rows[0]?.components?.[2]
          if (!rerollBtn || rerollBtn.disabled) {
            console.log(`[${now()}] ⚠️ Reroll unavailable`)
            return
          }

          try {
            await freshMessage.clickButton(rerollBtn.customId)
          } catch {
            await freshMessage.clickButton(rerollBtn)
          }

          console.log(`[${now()}] 🔄 Reroll ✅`)
        } catch {
          console.log(`[${now()}] 🔄 Reroll ❌`)
        }
      }, 5000)
    } catch {}
  })

  client.login(acc.token)
})