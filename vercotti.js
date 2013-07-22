var ALIASES = {
 // Format:  "Original name": "Alias"
};
var COLOURS = {
 "Nefeli": '2',
 "Bnay": '9',
 "Samba": '6',
 "Run": "DARK_RED",
 "_nether": 'c',
 "_the_end": '8'
};
var DEFAULT_WORLD = "Samba";

//////////////////////////////////////////////////////////////////////////

/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [-d|--dino|(-l|--luigi)|--] message\n"
          + "/<command> -e|--example [player]";
var DESCRIPTION = "Speak as Luigi Vercotti or Dino Vercotti (recurring"
                + " characters from Monty Python's Flying Circus).";

var SCRIPT_PDF = {
 "name": "CraftBnay-Vercotti",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "vercotti": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.Timer);
importClass(java.util.TimerTask);
importClass(java.util.logging.Level);

importClass(org.bukkit.ChatColor);
importClass(org.bukkit.Server);
importClass(org.bukkit.command.BlockCommandSender);
importClass(org.bukkit.entity.Player);
 
function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (command.getName().toLowerCase() == "vercotti") {
  if (args.length < 1)
   return false;
  
  args = arrayToString(args);
  var message = args.slice((args[0].substr(0, 1) == "-") ? 1 : 0).join(" ");
  if (["-e", "--example"].indexOf(args[0]) > -1) {
   var name = (message) ? message : sender.getName();
   vercotti(sender, "You've got a nice skin there, " + name + "...");
   vercotti(sender, "We wouldn't want anything to §ohappen§r to it...", true);
   //new Timer().schedule(new TimerTask(function() {
   // vercotti(sender, "We wouldn't want anything to §ohappen§r to it...", true);
   //}), 2000);
  }
  else {
   var dino = (["-d", "--dino"].indexOf(args[0]) > -1);
   vercotti(sender, message, dino);
  }
  
  return true;
 }
 return false;
}

function vercotti(sender, message, dino) {
 if (typeof(dino) === "undefined") dino = false;
 
 var firstName = (dino) ? "Dino" : "Luigi";
 
 var worldName;
 if (sender instanceof BlockCommandSender)
  worldName = sender.getBlock().getWorld().getName();
 else if (sender instanceof Player)
  worldName = sender.getWorld().getName();
 else
  worldName = DEFAULT_WORLD;
 
 var prefix = "";
 prefix += "[" + getColour(worldName) + getAlias(worldName) + ChatColor.RESET + "]";
 prefix += "<" + firstName + "Vercotti> ";
 
 server.broadcast(prefix + message, Server.BROADCAST_CHANNEL_USERS);
}

function getColour(name) {
 var alias = getAlias(name);
 var colour = 'r';
 for (spec in COLOURS) {
  if (COLOURS.hasOwnProperty(spec)) {
   colour = COLOURS[spec];
   if (alias == spec)
    break;
   if (alias.substr(alias.length - spec.length) == spec)
    break;
   colour = 'r';
  }
 }
 
 if (colour.length === 1 || colour.match(/^§[0-9a-zA-Z]$/))
  return ChatColor.getByChar(colour);
 else
  return ChatColor.valueOf(colour);
}

function getAlias(name) {
 name = String(name);
 for (world in ALIASES) {
  if (ALIASES.hasOwnProperty(world)) {
   var alias = ALIASES[world];
   if (name == world)
    return alias;
   if (name.substr(0, world.length + 1) == world + "_")
    return alias + name.match(/_.*$/)[0];
  }
 }
 return name;
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
