# Tired of losing a kit after one raid? Have I got the mod for you! Highly customizeable end-raid system for in-raid deaths.

After you die in-raid, run, or (configurable) on exiting raid, you lose a percentage of your items, not all of em'.

Your armour and weapons also take max-durability damage along with 'wear'. A full kit usually lasts about ~5 raids before its too broken to use anymore.
Also included is a truly secure Secure Container, meaning that any item you put in will keep the FIR status you found it with.

Everything else is vanilla. Love the game hate the dying.


All the changes this mods makes can be tweaked in the "src/config.json" file. All field names should be self explanatory.


This mod will NOT play nice with other "end raid replacement" mods as the end raid logic contains many methods that had to be re-written to be used in user mods.

This means that the entire "endLocalRaid" function is gone. Anything that takes place after that should work fine, any mod that retains the original (original meaning this modded "endLocalRaid" function) should work fine however.
