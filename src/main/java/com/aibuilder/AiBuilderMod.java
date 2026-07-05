package com.aibuilder;

import com.aibuilder.build.BuildSessionManager;
import com.aibuilder.build.BuilderMob;
import com.aibuilder.command.BuildCommands;
import com.aibuilder.config.AiBuilderConfig;
import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerEntityEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AiBuilderMod implements ModInitializer {
	public static final String MOD_ID = "aibuilder";
	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

	@Override
	public void onInitialize() {
		AiBuilderConfig config = AiBuilderConfig.load();
		BuildSessionManager manager = new BuildSessionManager(config);

		CommandRegistrationCallback.EVENT.register((dispatcher, buildContext, selection) ->
				BuildCommands.register(dispatcher, manager));

		ServerTickEvents.END_SERVER_TICK.register(manager::tick);

		ServerLifecycleEvents.SERVER_STOPPING.register(server -> manager.shutdown());

		// A builder left behind by a crash gets loaded from disk with our tag but no
		// session tracking it - quietly clean those up.
		ServerEntityEvents.ENTITY_LOAD.register((entity, level) -> {
			if (!BuilderMob.spawningNow && entity.getTags().contains(BuilderMob.TAG)
					&& !manager.isActiveBuilder(entity.getUUID())) {
				entity.discard();
			}
		});

		LOGGER.info("AI Builder ready - type /build <anything> in game (backend: {})", config.backend);
	}
}
