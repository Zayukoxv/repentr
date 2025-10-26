import { Client, GatewayIntentBits, Partials, PermissionsBitField } from "discord.js";

const TOKEN = "MTQzMTg1NjI0NTUzMDE2OTQ4NQ.GeQbmC.Az9TZ5UDHm4hPRf8JZbuwufMUz3QzAZ6n37RKI"; // <-- put your bot token here
const PREFIX = ",";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

const warns = new Map();

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

function isAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.Administrator);
}

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ---------------- PUBLIC COMMANDS ----------------
  if (command === "group") {
    return message.reply("Our Roblox group: https://www.roblox.com/communities/1030364459/Repent-R#!/about");
  }

  if (command === "game") {
    return message.reply("Our Roblox game: https://www.roblox.com/games/86471136350800/Zee-Hood-BACK#!/game-instances");
  }

  if (command === "roster") {
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === "roster");
    if (!role) return message.reply("No 'roster' role found.");
    const members = role.members.map(m => m.user.tag).join("\n");
    return message.channel.send(`**Roster Members:**\n${members || "No members found."}`);
  }

  // ---------------- ADMIN COMMANDS ----------------
  if ([
    "warn", "warnlist", "mute", "unmute",
    "kick", "ban", "unban", "role", "clear"
  ].includes(command)) {
    if (!isAdmin(message.member)) {
      return message.reply("🚫 You must be an **Administrator** to use this command.");
    }
  }

  // ⚠️ WARN
  if (command === "warn") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user to warn.");

    const currentWarns = warns.get(user.id) || 0;
    const newWarns = currentWarns + 1;
    warns.set(user.id, newWarns);

    message.channel.send(`${user.user.tag} has been warned (${newWarns}/3).`);

    if (newWarns >= 3) {
      warns.set(user.id, 0);
      await user.timeout(10 * 60 * 1000, "3 warnings (auto mute)");
      message.channel.send(`${user.user.tag} has been muted for 10 minutes (3 warnings).`);
    }
  }

  // 📋 WARNLIST
  if (command === "warnlist") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user.");
    const count = warns.get(user.id) || 0;
    return message.reply(`${user.user.tag} currently has **${count} warning(s)**.`);
  }

  // 🔇 MUTE
  if (command === "mute") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user to mute.");
    await user.timeout(10 * 60 * 1000, "Manual mute");
    message.channel.send(`${user.user.tag} has been muted for 10 minutes.`);
  }

  // 🔊 UNMUTE
  if (command === "unmute") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user to unmute.");
    await user.timeout(null);
    message.channel.send(`${user.user.tag} has been unmuted.`);
  }

  // 👢 KICK
  if (command === "kick") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user to kick.");
    await user.kick("Kicked by bot command");
    message.channel.send(`${user.user.tag} has been kicked.`);
  }

  // 🔨 BAN
  if (command === "ban") {
    const user = message.mentions.members.first();
    if (!user) return message.reply("Please mention a user to ban.");
    await user.ban({ reason: "Banned by bot command" });
    message.channel.send(`${user.user.tag} has been banned.`);
  }

  // 🔓 UNBAN
  if (command === "unban") {
    const userId = args[0];
    if (!userId) return message.reply("Please provide a user ID to unban.");
    try {
      await message.guild.members.unban(userId);
      message.channel.send(`✅ Successfully unbanned <@${userId}>.`);
    } catch (err) {
      message.reply("⚠️ Couldn't unban that user. Check the ID and try again.");
    }
  }

  // 🎭 ROLE
  if (command === "role") {
    const user = message.mentions.members.first();
    const role = message.mentions.roles.first();
    if (!user || !role) return message.reply("Usage: ,role @user @role");
    await user.roles.add(role);
    return message.reply(`${user.user.tag} has been given the ${role.name} role.`);
  }

  // 🧹 CLEAR
  if (command === "clear") {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount)) return message.reply("Please specify a number of messages to delete.");
    if (amount < 1 || amount > 100) return message.reply("Number must be between 1 and 100.");
    await message.channel.bulkDelete(amount + 1, true);
    return message.channel.send(`🧹 Deleted ${amount} messages.`);
  }
});

client.login(TOKEN);
