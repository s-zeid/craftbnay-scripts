/*  Copyright (c) 2013-2015 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [@[<player>]] {<enchantment level>[,...] [--verbose] [<flag> [...]]}|flags"
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

VENUE = "The Enchanted Cottage";
SLOGAN = "Doing Satya's bidding since before he was CEO.";

PRICE_MODIFIERS = [
 ["$1 per level per enchantment",
  "base",
  function(i) { i.price += 1 * i.levels; }],
 // Fees
 ["$5 Service fee per visit",
  "service",
  function(i) { i.fees += 5; }],
 ["$10 No enchantment fee (NEF)",
  "nef",
  function(i) { i.fees += (i.enchantments == 0) && 10; }],
 ["$10 Observation fee (plus NEF)",
  "--observing",
  function(i) { i.fees += 10; i.add("nef"); }],
 ["$9 Self-service fee per level",
  "--self-service",
  function(i) { i.fees += 9 * i.levels; }],
 ["$18 fee per minor present",
  "--minors=n",
  function(i) { i.fees += 18 * i.flags.minors; }],
 ["$100 Entrance fee",
  "entrance",
  function(i) { i.fees += 100; }],
 ["$25 Exit fee",
  "exit",
  function(i) { i.fees += 25; }],
 ["$200 ETF",
  "--etf",
  function(i) { i.fees += 200; }],
 ["$500 Fee per minecart in inventory or hotbar",
  "--minecarts=n",
  function(i, n) { i.fees += 500 * n; }],
 ["$250 Fee for complaining about excessive fees",
  "--complaining",
  function(i) { i.fees += 250; }],
 ["$800* Jumping Frog Fee Effective 2013-03-16 (* per level)",
  "jumping-frog",
  function(i) { i.fees += 800 * i.levels; }],
 ["$2,500/level Overdraft fee",
  "--overdraft",
  function(i) { i.fees += 2500 * i.levels; }],
 ["$1m/level for returned checks",
  "--returned-check",
  function(i) { i.fees += 1000000 * i.levels; }],
 ["$100/level Fee to help us with our bankruptcy court costs",
  "bankruptcy-court",
  function(i) { i.fees += 100 * i.levels; }],
 ["$250,000 Fee per level for all bankruptcy court judges",
  "--bankruptcy-judge",
  function(i) { i.fees += 250000 * i.levels; }],
 ["$40m/level wait-outside fee",
  "--wait-outside",
  function(i) { i.fees += 40000000 * i.levels; }],
 ["$1b/level for Microsoft critics",
  "--microsoft-critic",
  function(i) { i.fees += 1000000000 * i.levels; }],
 ["ALL Apple users: $999 trillion per level per device per millisec. fee!",
  "--apple-devices=n",    // assuming 1 minute
  function(i, n) { i.fees += 999000000000000 * i.levels * n * 60000; }],
 ["Linux - $20bn/level/minute",
  "--linux",
  function(i) { i.fees += 20000000000 * i.levels; }],
 ["GNU/Linux: $40bn/level/minute",
  "--gnu-linux",
  function(i) { i.fees += 40000000000 * i.levels; }],
 ["GNU+Linux: $80bn/level/minute",
  "--gnu-plus-linux",
  function(i) { i.fees += 80000000000 * i.levels; }],
 ["Android: $160bn/level/minute",
  "--android",
  function(i) { i.fees += 160000000000 * i.levels; }],
 ["Arch: $655.36tn/level/minute",
  "--arch",
  function(i) { i.fees += 655360000000000 * i.levels; }],
 ["MSFT employees + board:  95% OFF!",
  "--msft",
  function(i) { i.discount += 0.95; }],
 ["Satya Nadella: ALL FEES WAIVED!!!",
  "--satya-nadella",
  function(i) { i.feesWaived = true; i.add("msft"); }],
 // Surcharges
 ["5% surcharge per enchantment",
  "surcharge",
  function(i) { i.surcharges += .05 * i.enchantments; }],
];

//////////////////////////////////////////////////////////////////////////

IS_BUKKIT = (typeof(importClass) == "function" &&
             typeof(org) == "object" && org.bukkit);
IS_NODE   = (typeof(process) == "object" && process.argv);

if (IS_BUKKIT) {
 importClass(org.bukkit.ChatColor);
 importClass(org.bukkit.Material);
 importClass(org.bukkit.Server);
 importClass(org.bukkit.entity.Player);
}

SYSTEM_FLAGS = ["verbose"];

function getFlags() {
 var flags = [];
 for (var i = 0; i < SYSTEM_FLAGS.length; i++)
  flags.push(SYSTEM_FLAGS[i]);
 for (var i = 0; i < PRICE_MODIFIERS.length; i++) {
  var key = PRICE_MODIFIERS[i][1];
  if (typeof(key) == "string" && key.match(/^--?/))
   flags.push(PRICE_MODIFIERS[i][1].replace(/^--?/, ""));
 }
 return flags;
};

MINECART_TYPES = [];
if (IS_BUKKIT) {
 var materials = arrayToString(Material.values());
 for (var i = 0; i < materials.length; i++) {
  var name = materials[i];
  if (name.match(/(^|_)MINECART$/i))
   MINECART_TYPES.push(name);
 }
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
   if (args.length < 2) {
    !IS_BUKKIT && stderr(USAGE);
    return 2;
   }
   playerName = args[0].replace(/^@/, "");
   if (IS_BUKKIT && playerName.length > 0) {
    player = getPlayer(playerName, sender);
    if (player == null)
     return 0;
    playerName = player.getName();
    if (playerName == sender.getName())
     playerName = null;
   }
   if (playerName == null)
    args = args.slice(1);
   else
    args[1] = "@" + playerName;
  }
  
  var minecarts = countMinecarts(player);
  if (minecarts > 0) {
   var argN = (args[0].match(/^@/)) ? 1 : 0;
   args.splice(argN, 0, "--minecarts=" + String(minecarts));
  }
  
  var r = main(["cottage"].concat(args), function(s) { sender.sendMessage(s); });
  return r == 0;
 }
 return false;
}

function getPlayer(player, caller) {
 if (!IS_BUKKIT) return null;
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
 if (!IS_BUKKIT) return null;
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
function main(argv, stdout, stderr) {
 if (typeof(argv) == "undefined")
  argv = new Array();
 if (typeOf(argv) != "Array")
  argv = String(argv).split(" ");
 argv = arrayToString(argv);
 if (typeof(print) != "function" && typeof(console) == "object" && console.log)
  stdout = console.log;
 if (typeof(stderr) != "function")
  stderr = stdout;
 
 var usage = USAGE.replace(/^\/<command>/i, "");
 usage = argv[0] + usage;
 
 args = argv.slice(1);
 
 if (args.length < 1) {
  !IS_BUKKIT && stderr(usage);
  return 2;
 }

 var playerName = null;
 if (args[0].match(/^@/)) {
  if (args.length < 2) {
   !IS_BUKKIT && stderr(usage);
   return 2;
  }
  playerName = args[0].replace(/^@/, "");
  args = args.slice(1);
 }
 
 if (args[0].toLowerCase() == "flags") {
  stdout("Flags:  " + getFlags().join(", "));
  return 0;
 } else {
  var cottage = new Cottage(args[0], args.slice(1));
  var verbose = cottage.flags.verbose;
  if (cottage.flags.verbose) {
   var receipt = cottage.receipt();
   var thank = "Thank you" + ((playerName) ? ", " + playerName + "," : "")
   for (var i = 0; i < receipt.length; i++)
    stdout(receipt[i].replace(/^Thank you/, thank));
  } else {
   summary = cottage.summary();
   summary = "For " + ((playerName) ? playerName : "you") + ", " + summary;
   stdout(summary);
  }
  return 0;
 }
}

function Cottage(enchantmentList, flags) {
 if (typeof(enchantmentList) == "undefined") enchantmentList = [];
 if (typeof(flags)           == "undefined") flags           = new Flags();
 
 if (typeOf(enchantmentList) != "Array")
  enchantmentList = String(enchantmentList).split(",");
 if (!(flags instanceof Flags)) {
  flags = new Flags(flags);
 }
 
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
 
 var added = [];
 
 var info = {
  enchantments:     enchantments,
  levels:           levels,
  flags:            flags,
  price:            price,
  fees:             0,
  feesWaived:       false,
  discount:         0,
  surcharges:       0,
  surchargesWaived: false,
  itemized:         [],
  add:              function(what, n) {
   function Modifier(o) {
    var result = {};
    result.array = o;
    result.description = o[0];
    result.key = o[1];
    result.modify = o[2];
    
    result.flag = false;
    if (result.key.match(/^--?/)) {
     result.flag = result.key;
     result.key = result.flag.replace(/^--?/, "").replace(/=.*$/, "");
    }
    
    return result;
   }
   
   var modifier = null;
   if (typeof(what) != "string") {
    modifier = Modifier(what);
    what = modifier.key;
   } else {
    what = what.replace(/^--?/, "").replace(/=.*$/, "");
    if (added.indexOf(what) < 0) {
     for (var i = 0; i < PRICE_MODIFIERS.length; i++) {
      var test = Modifier(PRICE_MODIFIERS[i]);
      if (test.key == what) {
       modifier = test;
       return;
      }
     }
    }
   }
   
   if (added.indexOf(what) < 0) {
    if (!modifier.flag || flags[modifier.key]) {
     var self = this;
     var oldTotal = this.total();
     modifier.modify(self, flags[what]);
     var cost = this.total() - oldTotal;
     if (cost != 0)
      this.itemized.push([modifier.description, cost]);
     added.push(what);
    }
   }
  },
  feeTotal:         function() { return this.fees * !this.feesWaived },
  surchargeTotal:   function() {
   return (this.price + this.feeTotal()) * (this.surcharges * !this.surchargesWaived)
  },
  total:            function() {
   return (this.price + this.feeTotal() + this.surchargeTotal());
  },
  receipt:          function() {
   var result = [];
   function line(s) { result.push(s); }
   VENUE && line(VENUE.toUpperCase());
   SLOGAN && line("    " + SLOGAN);
   var nLine = "";
   nLine += this.enchantments + " enchantment";
   if (this.enchantments != 1) nLine += "s";
   nLine += ", ";
   nLine += this.levels + " total level";
   if (this.levels != 1) nLine += "s";
   nLine += ":"
   line(nLine);
   var items = this.itemized;
   for (var i = 0; i < items.length; i++) {
    var item = items[i];
    line("    " + formatCurrency(item[1]) + " - " + item[0]);
   }
   line("    " + formatCurrency(this.feeTotal()) + " - Total fees");
   line("    " + formatCurrency(this.surchargeTotal()) + " - Total surcharges");
   line("    " + formatCurrency(this.total()) + " - Grand Total");
   line("Thank you for shopping at " + VENUE + ".");
   return result;
  },
  summary:          function() {
   var result = "";
   result += this.enchantments + " enchantment";
   if (this.enchantments != 1) result += "s";
   result += " with a total of ";
   result += this.levels + " level";
   if (this.levels != 1) result += "s";
   result += " will cost ";
   result += formatCurrency(this.total());
   result += " at " + VENUE + ".";
   return result;
  }
 };
 
 for (var i = 0; i < PRICE_MODIFIERS.length; i++)
  info.add(PRICE_MODIFIERS[i]);
 
 return info;
}

function formatCurrency(amount, symbol) {
 if (typeof(symbol) == "undefined") symbol = "$";

 var o = amount;
 if (String(amount).match("e+")) {
  var real = "";
  var exp = Number(String(amount).replace(/^[^+]*\+/, ""));
  var l = String(amount).replace(/e+.*$/i, "").replace(/\..*$/, "");
  var r = String(amount).replace(/e+.*$/i, "").replace(/^[^.]*\./, "");
  var zeroes = (exp + 1) - l.length;
  for (var i = 0; i < Math.abs(zeroes - r.length); i++)
   real += "0";
  real = l + r + real;
  amount = real;
 }
 
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
 this.toArray = function() { 
  var result = [];
  for (var i = 0; i < flags.length; i++)
   result.push(flags[i].replace(/^--/, "").replace(/=.*$/, ""));;
  return result;
 };
 // update flags list
 // this needs to be here because reasons (TODO: explain the reasons)
 Flags.prototype.FLAGS = getFlags();
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
 // initialize instance members
 for (var i = 0; i < this.FLAGS.length; i++) {
  var name = this.FLAGS[i];
  if (name.match(/=n$/i))
   name = name.replace(/=n$/i, "");
  else if (name.match(/=.*$/))
   name = name.replace(/=.*$/, "");
  var member = name.replace(/-[a-z]/g, function(s) { 
   return s.replace("-", "").toUpperCase();
  });
  this[member] = this[name] = this.TYPES[name]();
 }
 // populate instance members
 for (var i = 0; i < flags.length; i++) {
  var flag   = flags[i].replace(/^--?/, "");
  var name   = flag.replace(/=.*$/, "").replace(/[A-Z]/g, function(s) {
   return "-" + s.toLowerCase();
  }).replace(/^-/, "");
  var member = name.replace(/-[a-z]/g, function(s) {
   return s.replace("-", "").toUpperCase();
  });
  var type = this.TYPES[name];
  if (typeof(type) == "undefined") continue;
  value = this[member];
  if (type === Boolean)
   value = true;
  else
   value = this.TYPES[name](flag.replace(/^[^=]*(=|$)/, ""));
  this[member] = this[name] = value;
  //if (type === Number && this[member] != this[member])
  // this[member] = 0;
 }
 return this;
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

if (IS_NODE) {
 function print(to, what, newline) {
  if (typeof(newline) == "undefined") newline = true;
  to.write(String(what) + ((newline) ? "\n" : ""));
 }
 function stdout(what, newline) { print(process.stdout, what, newline); }
 function stderr(what, newline) { print(process.stderr, what, newline); }
 var argv = process.argv.slice(1);
 var r = main(argv, stdout, stderr);
 process.exit(r);
}
