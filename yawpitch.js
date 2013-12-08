/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> <degrees>|snap/s/#|round/r/~|? [<player>]";
var DESCRIPTION = "Gets or sets a player's %s. "
                + " Other players' %s may be set"
                + " only if the caller is an operator.";

var SCRIPT_PDF = {
 "name": "CraftBnay-YawPitch",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "yaw":   {"usage": USAGE, "description": DESCRIPTION.replace(/%s/g, "yaw")},
  "pitch": {"usage": USAGE, "description": DESCRIPTION.replace(/%s/g, "pitch")}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.lang.Float);
importClass(java.util.logging.Level);

importClass(org.bukkit.Location);
importClass(org.bukkit.entity.Player);
importClass(org.bukkit.event.player.PlayerTeleportEvent);

var ROUND = "round";
var SNAP  = "snap";

function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 var commandName = String(command.getName().toLowerCase());
 if (["yaw", "pitch"].indexOf(commandName) > -1) {
  /* Argument parsing */
  
  args = arrayToString(args);
  var player;
  var angle;
  
  if (args.length > 2) {
   return false;
  }
  if (args.length == 0) {}
  if (args.length >= 1) {
   angle = args[0];
   if (["round", "r", "~"].indexOf(angle.toLowerCase()) > -1) {
    angle = ROUND;
   }
   else if (["snap", "s", "#"].indexOf(angle.toLowerCase()) > -1) {
    angle = SNAP;
   }
   else if (["?"].indexOf(angle.toLowerCase()) > -1) {
    angle = null;
   }
  }
  if (args.length >= 2) {
   player = args[1];
  }
  
  // Convert player argument to Player
  if (player) {
   var name = player;
   var offlinePlayer = server.getOfflinePlayer(player);
   player = offlinePlayer.getPlayer();
   if (!player) {
    if (!offlinePlayer.hasPlayedBefore())
     sender.sendMessage("The player " + name + " does not exist");
    else
     sender.sendMessage("The player " + name + " is offline");
    return true;
   }
  } else if (sender instanceof Player) {
   player = sender;
  } else {
   sender.sendMessage("Only Players have a " + commandName + ", not instances"
                       + " of " + sender.getClass().getSimpleName());
   return true;
  }
  
  // Convert angle argument to Float
  if (angle == null) {
   // do nothing
  } else if (angle == ROUND) {
   try {
    angle = Math.round(getAngle(commandName, player));
   } catch (e) {
    sender.sendMessage("Invalid command name \"" + commandName + "\".");
    return true;
   }
  } else if (angle == SNAP) {
   try {
    angle = Math.round(getAngle(commandName, player) / 45) * 45;
   } catch (e) {
    sender.sendMessage("Invalid command name \"" + commandName + "\".");
    return true;
   }
  } else if (angle.match(/^[-+]?[0-9]+(\.[0-9]+)?$/)) {
   angle = new Float(angle);
   if (Math.abs(angle) == Infinity) {
    sender.sendMessage("Overflow error.");
    return true;
   }
  } else {
   sender.sendMessage("Invalid angle.");
   return true;
  }
  
  /* Main action */
  
  var playerIsSender = (player.getName() == sender.getName());
  
  if (angle != null) {
   // Set angle
   if (!playerIsSender && !sender.isOp()) {
    sender.sendMessage("You must be an operator to change other players' " + commandName);
    return true;
   }
   
   var loc = player.getLocation();
   if (commandName == "yaw")
    loc.setYaw(normalizeAngle(angle));
   else if (commandName == "pitch")
    loc.setPitch(normalizeAngle(angle));
   else {
    sender.sendMessage("Invalid command name \"" + commandName + "\".");
    return true;
   }
   player.teleport(loc, PlayerTeleportEvent.TeleportCause.COMMAND);
   
   if (!playerIsSender)
    sender.sendMessage(player.getName() + "'s " + commandName + " has been updated");
  } else {
   // Get angle
   try {
    angle = getAngle(commandName, player);
   } catch (e) {
    sender.sendMessage("Invalid command name \"" + commandName + "\".");
    return true;
   }
   var prefix = (playerIsSender) ? "Your " : player.getName() + "'s ";
   sender.sendMessage(prefix + commandName + " is " + angle + " degrees");
  }
  
  return true;
 }
 return false;
};

function getAngle(type, player) {
 var loc = player.getLocation();
 if (type == "yaw")
  return loc.getYaw();
 else if (type == "pitch")
  return loc.getPitch();
 else
  throw "Invalid angle type " + type;
}

function normalizeAngle(angle) {
 // Avoid returning NaN
 if (Math.abs(angle) == Infinity)
  return angle;
 angle = angle % 360;
 if (angle >= 180)
  return angle - 360;
 return angle;
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
