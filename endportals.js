/*  Copyright (c) 2013 Scott Zeid.  Released under the X11 License.  */

var USAGE = "/<command> [0|1|true|false|(get|?)]";
var DESCRIPTION = "Enables or disables the placement of End Portals in"
                   + " dimensions other than the Overworld.  Ops only.";

var SCRIPT_PDF = {
 "name": "CraftBnay-EndPortals",
 "version": "1.0",
 "authors": ["Scott Zeid"],
 "commands": {
  "allow-end-portals": {"usage": USAGE, "description": DESCRIPTION}
 }
};

//////////////////////////////////////////////////////////////////////////

importClass(java.util.logging.Level);

importClass(net.minecraft.server.v1_6_R2.BlockEnderPortal);
 
function onEnable() {}
function onDisable() {}

function onCommand(sender, command, label, args) {
 if (["allow-end-portals"].indexOf(String(command.getName().toLowerCase())) > -1) {
  /* Argument parsing */
  
  args = arrayToString(args);
  var state = null;
  
  if (args.length > 1) {
   return false;
  }
  if (args.length == 1) {
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
  
  if (state === null) {
   // If state is toggle (null), get state from BlockEnderPortal.a and print it
   state = BlockEnderPortal.a;
   if (state)
    sender.sendMessage("End Portals CAN be created in non-Overworld dimensions.");
   else
    sender.sendMessage("End Portals CAN NOT be created in non-Overworld dimensions.");
  } else {
   // Otherwise, set state
   if (!sender.isOp()) {
    sender.sendMessage("You must be an operator to use this command.");
    return true;
   }
   BlockEnderPortal.a = state;
   sender.sendMessage("End Portals can " + ((state) ? "now" : "no longer")
                       + " be created in non-Overworld dimensions.");
  }
  
  return true;
 }
 return false;
};

function arrayToString(array) {
 var result = [];
 for (var i = 0; i < array.length; i++)
  result.push(String(array[i]));
 return result;
}
