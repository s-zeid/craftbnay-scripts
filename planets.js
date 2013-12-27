var ALIASES = {
 // Format:  "Original name": "Alias"
 "Planets": "The Planets"
};
var PLANETS = "The Planets";
var PLANETS_HUMAN = PLANETS;
var COMMAND_NAMES = ["planets", "hub"];

//////////////////////////////////////////////////////////////////////////

/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command>";
var DESCRIPTION = "Go to " + PLANETS_HUMAN + ".";

var SCRIPT_PDF = {
 "name": "CraftBnay-Planets",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {}
};

for (var i = 0; i < COMMAND_NAMES.length; i++)
 SCRIPT_PDF.commands[COMMAND_NAMES[i]] = {"usage": USAGE, "description": DESCRIPTION};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.logging.Level);

importClass(org.bukkit.ChatColor);
importClass(org.bukkit.Location);
importClass(org.bukkit.Material);
importClass(org.bukkit.Server);
importClass(org.bukkit.entity.Player);
importClass(org.bukkit.event.EventPriority);
importClass(org.bukkit.event.block.BlockFromToEvent);
importClass(org.bukkit.event.player.PlayerTeleportEvent);

var DISABLED = undefined;
var EVENTS = {};

var _MULTIVERSE = DISABLED;
var _PLANETS_WORLD = DISABLED;

function onEnable() {
 _MULTIVERSE = null;    // lazily loaded via getMultiverse()
 _PLANETS_WORLD = null;    // lazily loaded via getPlanetsWorld()
 for (e in EVENTS) {
  if (EVENTS.hasOwnProperty(e))
   helper.registerEvent(EVENTS[e][0], EVENTS[e][1], e)
 }
}
function onDisable() {
 _MULTIVERSE = DISABLED;    // causes getMultiverse() to return null
 _PLANETS_WORLD = DISABLED;    // causes getPlanetsWorld() to return null
}

function onCommand(sender, command, label, args) {
 if (inArray(String(command.getName()), COMMAND_NAMES, false)) {
  if (!(sender instanceof Player)) {
   sender.sendMessage(ChatColor.RED
                     + "Only players can use this command."
                     + ChatColor.RESET);
   return true;
  }
  
  sendToPlanets(sender, sender);
  return true;
 }
 return false;
}

function sendToPlanets(player, commandSender) {
 var multiverse = getMultiverse();
 if (multiverse) {
  var dest = multiverse.getDestFactory().getDestination(PLANETS);
  multiverse.getSafeTTeleporter().safelyTeleport(commandSender, player, dest);
 } else {
  player.teleport(getPlanetsWorld().getSpawnLocation());
 }
}

EVENTS ["onDragonEggTeleport"] = [BlockFromToEvent, EventPriority.NORMAL];
function onDragonEggTeleport(e) {
 var block = e.getBlock();
 if (block.getWorld().equals(getPlanetsWorld())) {
  if (Material.DRAGON_EGG.equals(block.getType()))
   e.setCancelled(true);
 }
}

EVENTS ["onPlayerTeleport"] = [PlayerTeleportEvent, EventPriority.HIGHEST];
function onPlayerTeleport(e) {
 var from    = e.getFrom().getWorld();
 var to      = e.getTo().getWorld();
 var planets = getPlanetsWorld();
 if (!from.equals(to) && (from.equals(planets) || to.equals(planets)))
  e.getPlayer().setFlying(false);
}

function getPlanetsWorld() {
 if (_PLANETS_WORLD !== DISABLED) {
  if (_PLANETS_WORLD !== null)
   return _PLANETS_WORLD;
  _PLANETS_WORLD = getWorld(PLANETS);
  return _PLANETS_WORLD;
 }
 return null;
}

// Utility functions /////////////////////////////////////////////////////

function getMultiverse() {
 if (_MULTIVERSE !== DISABLED) {
  if (_MULTIVERSE !== null)
   return _MULTIVERSE;
  return server.getPluginManager().getPlugin("Multiverse-Core");
 }
}

function getWorld(nameOrAlias) {
 var multiverse = getMultiverse();
 if (multiverse) {
  var dest = multiverse.getDestFactory().getDestination(nameOrAlias);
  if (dest) {
   var loc = dest.getLocation(null);
   if (loc)
    return loc.getWorld();
  }
 }
 return server.getWorld(fromAlias(nameOrAlias));
}

function getMVWorld(nameOrAlias) {
 var multiverse = getMultiverse();
 if (multiverse)
  return multiverse.getMVWorldManager().getMVWorld(nameOrAlias);
 return null;
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

function fromAlias(alias) {
 alias = String(alias);
 for (world in ALIASES) {
  if (ALIASES.hasOwnProperty(world)) {
   var name = world;
   var testAlias = ALIASES[world];
   if (alias == testAlias)
    return name;
   if (alias.substr(0, testAlias.length + 1) == testAlias + "_")
    return name + alias.match(/_.*$/)[0];
  }
 }
 return alias;
}

function inArray(needle, haystack, caseSensitive) {
 if (typeof(caseSensitive) == "undefined") caseSensitive = true;
 if (!caseSensitive && needle.toLowerCase)
  needle = needle.toLowerCase();
 for (var i = 0; i < haystack.length; i++) {
  var element = haystack[i];
  if (!caseSensitive && element.toLowerCase)
   element = element.toLowerCase();
  if (element === needle)
   return true;
 }
 return false;
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
