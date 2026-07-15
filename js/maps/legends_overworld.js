'use strict';
/**
 * Legendary overworld presence: each of the four static legends now STANDS at
 * its site as a visible overworld sprite (scaled battle art — real overworld
 * sprites are a Fable task) that you walk up to and challenge. They appear only
 * once their prerequisite is met and vanish once caught or defeated.
 *   • Auroryx   — Sky Spire altar, after Magnus Voll is beaten.
 *   • Umbryx    — Sky Spire altar, postgame (Champion).
 *   • Vesperyx  — Twilight Shrine, Dusk Isles.
 *   • Magnadrake — Aurora Depths lair.
 */

// Auroryx: triggered by approaching the altar (moved out of the Magnus cutscene).
Scripts.register('auroryx_battle', () => {
  if (Game.flags.auroryxDone) { Textbox.say('The summit altar is calm now. The aurora drifts gently overhead.', Scripts.done); return; }
  if (!Game.partyAlive()) { Textbox.say('AURORYX blazes above the altar — but your team can\'t battle. Heal first!', Scripts.done); return; }
  const charm = Game.hasItem('storm_charm');
  Textbox.say(charm
    ? 'You raise the STORM CHARM. Its light pulses, and the raging AURORYX falters — steadied just enough. Now\'s your chance!'
    : 'AURORYX fixes you with a blazing golden eye and looses a world-shaking roar!', () => {
    if (charm) Game.give('ultraorb', 5);
    Music.play('battle_champion');
    Overworld.beginBattleFlash(() => { Game.startWildBattle('auroryx', 50, 'aurora'); Game.flags.auroryxEncountered = true; });
  });
});

// Place the legendary sprites, and make the Ionar boss vanish once beaten so the
// player can reach the altar.
(() => {
  const spire = Maps['sky_spire'];
  if (spire) {
    for (const n of spire.npcs || []) { if (n.script === 'spire_boss') n.hideFlag = 'beat_ionar_boss'; }
    spire.npcs.push({ x: 8, y: 2, sprite: 'npc_villager', monSprite: 'auroryx', monScale: 36, dir: 'down', move: 'static', passable: false,
      showFlag: 'beat_ionar_boss', hideFlag: 'auroryxDone', script: 'auroryx_battle' });
    spire.npcs.push({ x: 8, y: 1, sprite: 'npc_villager', monSprite: 'umbryx', monScale: 36, dir: 'down', move: 'static', passable: false,
      showFlag: 'champion', hideFlag: 'umbryxDone', script: 'summit_umbryx' });
  }
  const shrine = Maps['dusk_shrine'];
  if (shrine) shrine.npcs = (shrine.npcs || []).concat([{ x: 7, y: 2, sprite: 'npc_villager', monSprite: 'vesperyx', monScale: 36, dir: 'down', move: 'static', passable: false,
    hideFlag: 'vesperyxDone', script: 'dusk_shrine_legend' }]);
  const lair = Maps['aurora_depths2'];
  if (lair) lair.npcs = (lair.npcs || []).concat([{ x: 8, y: 2, sprite: 'npc_villager', monSprite: 'magnadrake', monScale: 34, dir: 'down', move: 'static', passable: false,
    hideFlag: 'magnadrakeDone', script: 'depths_legendary' }]);
})();
