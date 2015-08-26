/*  Copyright (c) 2013-2015 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [<mode>[!]|get|? [<player>]]";
var DESCRIPTION = "Gets or sets a player's game mode. "
                + " Other players' game modes may be set"
                + " only if the caller is an operator.";

var SCRIPT_PDF = {
 "name": "CraftBnay-GameMode",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "gm":          {"usage": USAGE, "description": DESCRIPTION},
  "gamemode-cb": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.logging.Level);

importClass(org.bukkit.GameMode);
importClass(org.bukkit.entity.Player);
 
var SAFE_GAME_MODES = [GameMode.CREATIVE, GameMode.SPECTATOR];

function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (["gm", "gamemode-cb"].indexOf(String(command.getName().toLowerCase())) > -1) {
  /* Argument parsing */
  
  args = arrayToString(args);
  var player;
  var mode;
  var force;
  
  if (args.length > 2) {
   return false;
  }
  if (args.length == 0) {}
  if (args.length >= 1) {
   mode = args[0];
   if (["get", "?"].indexOf(mode.toLowerCase()) > -1) {
    mode = null;
   } else if (mode.match(/!$/)) {
    force = true;
    mode = mode.replace(/!$/, "");
   } else {
    force = false;
   }
  }
  if (args.length >= 2) {
   player = args[1];
  }
  
  // Convert mode argument to GameMode
  if (!mode) {
   mode = null;
  } else if (mode.match(/^[0-9]+$/)) {
   var original = mode;
   mode = GameMode.getByValue(Number(mode));
   if (mode === null) {
    sender.sendMessage(String(original) + " is not a valid game mode");
    return true;
   }
  } else {
   try {
    mode = GameMode.valueOf(mode.toUpperCase());
   } catch (e if e.javaException instanceof java.lang.IllegalArgumentException) {
    sender.sendMessage(mode.toUpperCase() + " is not a valid game mode");
    return true;
   }
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
   sender.sendMessage("Only Players have game modes, not instances of "
                       + sender.getClass().getSimpleName());
   return true;
  }
  
  /* Main action */
  
  var playerIsSender = (player.getName() == sender.getName());
  
  if (mode) {
   // Set game mode
   if (!playerIsSender && !sender.isOp()) {
    sender.sendMessage("You must be an operator to change other players' game modes");
    return true;
   }
   
   if (player.getGameMode().equals(mode)) {
    var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
    sender.sendMessage(prefix + "already in " + mode.toString().toLowerCase() + " mode");
    return true;
   }
   if (!force && !isSafeGameMode(mode)) {
    if (player.isFlying()) {
     var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
     sender.sendMessage(prefix + "flying.  Game mode change denied");
     return true;
    }
    if (!isOnGround(player)) {
     // Player.isOnGround() is deprecated, so this check may fail.
     // The isOnGround() helper function below returns true in the event the
     // method is ever removed.
     var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
     sender.sendMessage(prefix + "not on the ground.  Game mode change denied");
     return true;
    }
   }
   
   player.setGameMode(mode);
   if (!playerIsSender)
    sender.sendMessage(player.getName() + "'s game mode has been updated");
  } else {
   // Get game mode
   mode = player.getGameMode();
   var prefix = (playerIsSender) ? "Your " : player.getName() + "'s ";
   sender.sendMessage(prefix + "game mode is " + mode);
  }
  
  return true;
 }
 return false;
};

function isSafeGameMode(mode) {
 for (var i = 0; i < SAFE_GAME_MODES.length; i++) {
  if (SAFE_GAME_MODES[i].equals(mode))
   return true;
 }
 return false;
}

function isOnGround(player) {
 if (!(player instanceof Player)) return false;
 
 try {
  return player.isOnGround();
 } catch (e) {
  helper.log(Level.WARNING, "The deprecated method Player.isOnGround() has been removed");
  return true;
 }
}

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
