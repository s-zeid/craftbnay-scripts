/*  Copyright (c) 2013-2016 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [<selector>] [<multiplier>|?]";
var DESCRIPTION = "Gets or sets a minecart's speed. "
                + " Selectors may match minecarts directly or the entities"
                + " riding them. "
                + " If no selector is given, then the minecart that the"
                + " player is currently riding will be used. "
                + " If no multiplier is given (or if `?` is given), then"
                + " the multiplier will be sent to the caller. "
                + " Only operators and command blocks may set a minecart's"
                + " speed.";

var SCRIPT_PDF = {
 "name": "CraftBnay-CartSpeed",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "cartspeed": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.lang.Float);
importClass(java.util.logging.Level);

importClass(org.bukkit.Location);
importClass(org.bukkit.entity.Entity);
importClass(org.bukkit.entity.Minecart);
importClass(org.bukkit.entity.Player);
importClass(org.bukkit.event.player.PlayerTeleportEvent);


var CONSTANT = 0.4;
var NESTED = "__NESTED__";
var NO_NAME = "~";


function onEnable() {}
function onDisable() {}


function onCommand(sender, command, label, args) {
 var commandName = String(command.getName().toLowerCase());
 if (["cartspeed"].indexOf(commandName) > -1) {
  var server = sender.getServer();
  function log(s) {
   server.getLogger().info(SCRIPT_PDF["name"] + ": " + s);
  }
  
  /* Argument parsing */
  
  args = arrayToString(args);
  
  var entity;
  var minecart;
  var multiplier;
  var multiplierString;
  var nested;
  var nestedPlayerName;
  var selector;
  var sendTo;
  
  if (args.length >= 2 && args[0] == NESTED) {
   nested = true;
   nestedPlayerName = args[1];
   args = args.slice(2);
   
   if (nestedPlayerName == NO_NAME) {
    nestedPlayerName = null;
   } else {
    sendTo = server.getPlayerExact(nestedPlayerName);
   }
  } else {
   nested = false;
  }
  
  if (!sendTo)
   sendTo = sender;
  
  if (args.length > 2)
   return false;
  
  if (args.length == 0) {
   multiplierString = null;
  } else if (args.length == 1) {
   multiplierString = args[0];
  } else if (args.length == 2) {
   selector = args[0];
   multiplierString = args[1];
  }
  
  // Convert multiplier argument to Float or null (null means get value)
  if (multiplierString == null) {
   "pass";
  } else if (["?"].indexOf(multiplierString.toLowerCase()) > -1) {
   multiplier = null;
  } else if (multiplierString.match(/^[-+]?[0-9]+(\.([0-9]+)?)?$/)) {
   multiplier = new Float(multiplierString);
   if (Math.abs(multiplier) == Infinity) {
    sendTo.sendMessage("Overflow error.");
    return true;
   }
  } else {
   //sendTo.sendMessage("Invalid multiplier.");
   //return true;
   // might be a selector
   selector = multiplierString;
   multiplierString = null;
   multiplier = null;
  }
  
  // Convert selector argument to Minecart
  if (selector) {
   if (nested)
    return false;  // prevent infinite recursion
   
   if (selector.indexOf("\\") == 0) {
    // escaped first character
    selector = selector.slice(1);
   }
   if (selector.indexOf("@") != 0) {
    // player name
    entity = server.getPlayer(selector);
    if (!selector) {
     sendTo.sendMessage("The player `" + selector + "` is offline or does not exist");
     return true;
    }
   } else {
    // target selector; parsed by re-running the command via /execute
    var nestedPlayerName = (sender instanceof Player) ? sender.getName() : NO_NAME;
    var cmd = [commandName, NESTED, nestedPlayerName, multiplierString];
    cmd = ["execute", selector, "~", "~", "~"].concat(cmd);
    var cmdString = cmd.join(" ");
    //log("About to execute `" + cmdString + "`");
    server.dispatchCommand(sender, cmdString);
    return true;
   }
  } else {
   entity = sender;
  }
  //log("Selected entity: " + entity.toString());
  if (entity instanceof org.bukkit.command.ProxiedCommandSender) {
   //log("Callee: " + entity.getCallee().toString());
   //log("Caller: " + entity.getCaller().toString());
   entity = entity.getCallee();
  }
  if (entity instanceof Minecart) {
   minecart = entity;
  } else if ((entity instanceof Player) || (nested && (entity instanceof Entity))) {
   // get cart being ridden
   minecart = entity.getVehicle();
   if (minecart == null || !(minecart instanceof Minecart)) {
    if (!nested)
     sendTo.sendMessage("You must either give a selector as the first argument"
                        + " or be riding a minecart.");
    return true;
   }
  } else {
   if (!nested)
    sendTo.sendMessage("A selector must be given when executing from a command"
                       + " block or another non-player entity.");
   return true;
  }
  
  /* Main action */
  
  var senderIsPlayer = (sender instanceof Player) || (sendTo instanceof Player);
  
  var loc = minecart.getLocation();
  var locationString = [loc.getBlockX(), loc.getBlockY(), loc.getBlockZ()].join(", ");
  locationString = "(" + locationString + ")";
  
  var locationDesc = "the minecart at " + locationString;
  if (senderIsPlayer && minecart.equals(sendTo.getVehicle()))
   locationDesc = "your minecart";
  
  if (multiplier != null) {
   // Set multiplier
   if (senderIsPlayer && !sender.isOp() && !nested) {
    sendTo.sendMessage("You must be an operator to change minecarts' speeds.");
    return true;
   }
   
   minecart.setMaxSpeed(CONSTANT * multiplier);
   var speed = getSpeed(minecart);
   sendTo.sendMessage("Changed the speed multiplier of " + locationDesc
                      + " to " + speed + ".");
  } else {
   // Get multiplier
   var speed = getSpeed(minecart);
   sendTo.sendMessage("The speed multiplier of " + locationDesc
                      + " is " + speed + ".");
  }
  
  return true;
 }
 return false;
};


function getSpeed(minecart, round) {
 if (typeof(round) == "undefined")
  round = true;
 
 result = minecart.getMaxSpeed() / CONSTANT;
 if (round) {
  // round speed to the nearest thousandths place
  result = Math.round(result * 1000) / 1000;
 }
 return result;
}


function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
