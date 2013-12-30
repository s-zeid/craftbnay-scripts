/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [<mode>[!]|get|? [<player>]]";
var DESCRIPTION = "Enables or disables a player's flight mode. "
                + " Other players' flight modes may be set"
                + " only if the caller is an operator.";

var SCRIPT_PDF = {
 "name": "CraftBnay-Fly",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "fly": {"usage": USAGE, "description": DESCRIPTION},
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.logging.Level);

importClass(org.bukkit.entity.Player);

function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (["fly"].indexOf(String(command.getName().toLowerCase())) > -1) {
  /* Argument parsing */
  
  args = arrayToString(args);
  var player;
  var state;
  
  if (args.length > 2) {
   return false;
  }
  if (args.length == 0) {}
  if (args.length >= 1) {
   state = args[0];
   if (state == "true" || state == "1")
    state = true;
   else if (state == "false" || state == "0")
    state = false;
   else if (state == "get" || state == "?")
    state = null;
   else
    return false;
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
   sender.sendMessage("Only Players can fly, not instances of "
                       + sender.getClass().getSimpleName());
   return true;
  }
  
  /* Main action */
  
  var playerIsSender = (player.getName() == sender.getName());
  
  if (state != null) {
   // Set flight mode
   if (!playerIsSender && !sender.isOp()) {
    sender.sendMessage("You must be an operator to change other players' flight modes");
    return true;
   }
   if (playerIsSender && !player.getAllowFlight()) {
    sender.sendMessage("You are not allow to fly");
    return true;
   }
   
   if (player.isFlying() == state) {
    var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
    sender.sendMessage(prefix + "already " + ((state) ? "flying" : "not flying"));
    return true;
   }
   
   player.setFlying(state);
   if (state) {
    // If the player is on the ground and we don't do this, then they will
    // stop flying almost immediately.
    player.teleport(player.getLocation().add(0, 0.2, 0));
   }
   if (!playerIsSender) {
    var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
    sender.sendMessage(prefix + ((state) ? "now flying" : "no longer flying"));
   }
  } else {
   // Get flight mode
   state = player.isFlying();
   var prefix = (playerIsSender) ? "You are " : player.getName() + " is ";
   sender.sendMessage(prefix + ((state) ? "flying" : "not flying"));
  }
  
  return true;
 }
 return false;
};

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
