/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [@[<player>]] {<enchantment level>[,...] [<flag> [...]]}|flags"
var DESCRIPTION = "Get the price for an enchantment from the Enchanted"
                + " Cottage.";

var SCRIPT_PDF = {
 "name": "CraftBnay-Cottage",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "cottage": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(org.bukkit.ChatColor);
importClass(org.bukkit.Material);
importClass(org.bukkit.Server);
importClass(org.bukkit.entity.Player);

FLAGS = ["observing", "self-service", "minors=n", "etf",
         "complaining", "minecarts=n", "overdraft",
         "returned-check", "bankruptcy-judge"];

MINECART_TYPES = [];
var materials = arrayToString(Material.values());
for (var i = 0; i < materials.length; i++) {
 var name = materials[i];
 if (name.match(/(^|_)MINECART$/i))
  MINECART_TYPES.push(name);
}

function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (command.getName().toLowerCase() == "cottage") {
  if (args.length < 1)
   return false;
  
  args = arrayToString(args);
  
  var playerName = null;
  var player = sender;
  if (args[0].match(/^@/)) {
   if (args.length < 2)
    return false;
   playerName = args[0].replace(/^@/, "");
   if (playerName.length > 0) {
    player = getPlayer(playerName, sender);
    if (player == null)
     return true;
    playerName = player.getName();
    if (playerName == sender.getName())
     playerName = null;
   }
   args = args.slice(1);
  }
  
  var message = cottageCommand(args, countMinecarts(player));
  if (!message.match(/^Flags:/))
   message = "For " + ((playerName) ? playerName : "you") + ", " + message;
  sender.sendMessage(message);
  return true;
 }
 return false;
}

function getPlayer(player, caller) {
 var name = player;
 var offlinePlayer = server.getOfflinePlayer(player);
 player = offlinePlayer.getPlayer();
 if (!player) {
  if (caller) {
   if (!offlinePlayer.hasPlayedBefore())
    caller.sendMessage("The player " + name + " does not exist");
   else
    caller.sendMessage("The player " + name + " is offline");
  }
  return null;
 }
 return player;
}

function countMinecarts(player) {
 var minecarts = 0;
 if (player instanceof Player) {
  for (var i = 0; i < MINECART_TYPES.length; i++) {
   try {
    var type = Material.valueOf(MINECART_TYPES[i]);
   } catch (e) {
    if (e.javaException instanceof java.lang.IllegalArgumentException)
     continue;
    else
     throw e;
   }
   var stacks = player.getInventory().all(type).values().toArray();
   for (var j = 0; j < stacks.length; j++) {
    minecarts += stacks[j].getAmount();
   }
  }
 }
 return minecarts;
}

/* Start portable code (plus FLAGS constant above) */
function cottageCommand(args, minecarts) {
 if (typeof(args)      == "undefined") args      = new Array();
 if (typeof(minecarts) == "undefined") minecarts = 0;
 
 if (typeOf(args) != "Array")
  args = String(args).split(" ");
 
 if (args.length == 0)
  return false;
 
 var message = "";
 if (args[0].toLowerCase() == "flags") {
  message = "Flags:  " + FLAGS.join(", ");
 } else {
  var cottage = new Cottage(args[0], args.slice(1), minecarts);
  message = cottage.format();
 }
 return message;
}

function Cottage(enchantmentList, flags, minecarts) {
 if (typeof(enchantmentList) == "undefined") enchantmentList = [];
 if (typeof(flags)           == "undefined") flags           = new Flags();
 if (typeof(minecarts)       == "undefined") minecarts       = 0;
 
 if (typeOf(enchantmentList) != "Array")
  enchantmentList = String(enchantmentList).split(",");
 if (!(flags instanceof Flags)) {
  flags = new Flags(flags);
 }
 if (flags.minecarts == 0 || flags.minecarts != flags.minecarts /* (NaN) */)
  flags.minecarts = minecarts;
 
 var enchantments = 0;
 var levels       = 0;
 var price        = 0;
 
 for (var i = 0; i < enchantmentList.length; i++) {
  var enchantment = Number(enchantmentList[i]);
  if (enchantment > 0) {
   enchantments += 1;
   levels       += enchantment;
  }
 }
 
 // $1 per level per enchantment
 price += 1 * levels;
 // $5 Service fee per visit
 price += 5;
 // $10 No enchantment fee (NEF)
 if (enchantments == 0)
  price += 10;
 // $10 Observation fee (plus NEF)
 if (flags.observing)
  price += 10;
 // $9 Self-service fee per level
 if (flags.selfService)
  price += 9 * levels;
 // $18 fee per minor present
 if (flags.minors > 0)
  price += 18 * flags.minors;
 // $100 Entrance fee
 price += 100;
 // $25 Exit fee
 price += 25;
 // $200 ETF
 if (flags.etf)
  price += 200;
 // $500 Fee per minecart in inventory or hotbar
 if (flags.minecarts > 0)
  price += 500 * flags.minecarts;
 // $250 Fee for complaining about excessive fees
 if (flags.complaining)
  price += 250;
 // $800* Jumping Frog Fee Effective 2013-03-16 (* per level)
 price += 800 * levels;
 // $2,500/level Overdraft fee
 if (flags.overdraft)
  price += 2500 * levels;
 // $1m/level for returned checks
 if (flags.returnedCheck)
  price += 1000000 * levels;
 // $100/level Fee to help us with our bankruptcy court costs
 price += 100 * levels;
 // $250,000 Fee per level for all bankruptcy court judges
 if (flags.bankruptcyJudge)
  price += 250000 * levels;
 // 5% surcharge per enchantment
 for (var i = 0; i < enchantments; i++)
  price *= 1.05;
 
 return {
  enchantments: enchantments,
  levels:       levels,
  flags:        flags,
  price:        price,
  format:       function() {
   var message = "";
   message += this.enchantments + " enchantment";
   if (this.enchantments != 1) message += "s";
   message += " with a total of ";
   message += this.levels + " level";
   if (this.levels != 1) message += "s";
   message += " will cost ";
   message += formatCurrency(this.price, "$");
   message += " at The Enchanted Cottage.";
   return message;
  }
 };
}

function formatCurrency(amount, symbol) {
 var ret = "";
 var parts = (String(amount) + ".0").split(".").slice(0,2);
 var whole = parts[0].split("");
 var decimal = parts[1];
 
 for (var i = parts[0].length; i > 3; i -= 3) {
  whole.splice(i - 3, 0, ",");
 }
 whole = whole.join("");
 
 ret += symbol;
 ret += whole;
 ret += ".";
 ret += (String(Math.round(Number("." + decimal) * 10)).split(".")[0] + "00").slice(0, 2);
 return ret;
}

function Flags(flags) {
 if (flags instanceof Flags)
  return flags;
 if (typeof(flags) == "undefined")
  flags = new Array();
 if (typeOf(flags) != "Array")
  flags = String(flags).replace(",", " ").split(" ");
 // initialize members
 for (var i = 0; i < this.FLAGS.length; i++) {
  var name = this.FLAGS[i];
  if (name.match(/=n$/i))
   name = name.replace(/=n$/i, "");
  else if (name.match(/=.*$/))
   name = name.replace(/=.*$/, "");
  var member = name.replace(/-[a-z]/, function(s) { 
   return s.replace("-", "").toUpperCase();
  });
  this[member] = this.TYPES[name]();
 }
 // populate members
 for (var i = 0; i < flags.length; i++) {
  var flag   = flags[i].replace(/^--?/, "");
  var name   = flag.replace(/=.*$/, "").replace(/[A-Z]/, function(s) {
   return "-" + s.toLowerCase();
  });
  var member = name.replace(/-[a-z]/, function(s) {
   return s.replace("-", "").toUpperCase();
  });
  var type = this.TYPES[name];
  if (typeof(type) == "undefined") continue;
  if (type === Boolean)
   this[member] = true;
  else
   this[member] = this.TYPES[name](flag.replace(/^[^=]*(=|$)/, ""));
  //if (type === Number && this[member] != this[member])
  // this[member] = 0;
 }
 return this;
}
Flags.prototype.FLAGS = FLAGS;
Flags.prototype.TYPES = {};
for (var i = 0; i < Flags.prototype.FLAGS.length; i++) {
 var name  = Flags.prototype.FLAGS[i];
 var name2 = name;
 var type;
 if (name.match(/=n$/i)) {
  name2 = name.replace(/=n$/i, "");
  type  = Number;
 } else if (name.match(/=.*$/)) {
  name2 = name.replace(/=.*$/, "");
  type  = String;
 } else
  type  = Boolean;
 Flags.prototype.TYPES[name] = type;
 if (name !== name2)
  Flags.prototype.TYPES[name2] = type;
}

function typeOf(o) {
 if (typeof(o) == "undefined")
  return "undefined";
 if (o === null)
  return "null";
 return Object.prototype.toString.apply(o)
         .replace(/^\[object /i, "")
         .replace(/\]$/, "")
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
/* End portable code */
