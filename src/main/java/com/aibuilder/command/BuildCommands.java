package com.aibuilder.command;

import com.aibuilder.build.BuildSessionManager;
import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.permission.v1.PermissionPredicates;
import net.minecraft.ChatFormatting;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.Identifier;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.server.permissions.PermissionLevel;

/**
 * /build <description>, /undo, /buildcancel
 */
public final class BuildCommands {
	private BuildCommands() {
	}

	public static void register(CommandDispatcher<CommandSourceStack> dispatcher, BuildSessionManager manager) {
		dispatcher.register(Commands.literal("build")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.then(Commands.argument("what", StringArgumentType.greedyString())
						.executes(context -> {
							ServerPlayer player = context.getSource().getPlayer();
							if (player == null) {
								context.getSource().sendFailure(Component.literal("Only players can /build."));
								return 0;
							}
							manager.startBuild(player, StringArgumentType.getString(context, "what"));
							return 1;
						}))
				.executes(context -> {
					context.getSource().sendFailure(Component.literal(
							"Tell me what to build, e.g. /build a cozy medieval house with a redstone piston door. "
									+ "Tip: start with 'instant' (/build instant a big castle) to skip the builder mob "
									+ "and place it near-instantly.")
							.withStyle(ChatFormatting.RED));
					return 0;
				}));

		dispatcher.register(Commands.literal("undo")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/undo"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					ServerPlayer player = context.getSource().getPlayer();
					if (player == null) {
						context.getSource().sendFailure(Component.literal("Only players can /undo."));
						return 0;
					}
					manager.undo(player);
					return 1;
				}));

		dispatcher.register(Commands.literal("buildcancel")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					ServerPlayer player = context.getSource().getPlayer();
					if (player == null) {
						context.getSource().sendFailure(Component.literal("Only players can /buildcancel."));
						return 0;
					}
					manager.cancel(player);
					return 1;
				}));

		// /buildset <model|timeout|speed> <value> - change settings without leaving the game
		dispatcher.register(Commands.literal("buildset")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.then(Commands.argument("setting", StringArgumentType.word())
						.then(Commands.argument("value", StringArgumentType.greedyString())
								.executes(context -> {
									String key = StringArgumentType.getString(context, "setting");
									String value = StringArgumentType.getString(context, "value");
									String message = manager.applySetting(key, value);
									context.getSource().sendSuccess(
											() -> Component.literal("⚙ " + message).withStyle(ChatFormatting.AQUA), false);
									return 1;
								})))
				.executes(context -> {
					context.getSource().sendFailure(Component.literal(
							"Usage: /buildset <model|timeout|speed|flyspeed> <value>  e.g. /buildset model sonnet, "
									+ "/buildset flyspeed 4")
							.withStyle(ChatFormatting.RED));
					return 0;
				}));

		// /buildstatus - show current settings
		dispatcher.register(Commands.literal("buildstatus")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					context.getSource().sendSuccess(
							() -> Component.literal(manager.settingsSummary()).withStyle(ChatFormatting.GRAY), false);
					return 1;
				}));

		// /buildsave <name> - keep the build you just made
		dispatcher.register(Commands.literal("buildsave")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.then(Commands.argument("name", StringArgumentType.word())
						.executes(context -> {
							ServerPlayer player = context.getSource().getPlayer();
							if (player == null) {
								context.getSource().sendFailure(Component.literal("Only players can /buildsave."));
								return 0;
							}
							manager.saveLastBuild(player, StringArgumentType.getString(context, "name"));
							return 1;
						}))
				.executes(context -> {
					context.getSource().sendFailure(Component.literal(
							"Usage: /buildsave <name> - saves the build you just made").withStyle(ChatFormatting.RED));
					return 0;
				}));

		// /buildmake <name> - rebuild a saved design (no AI, free)
		dispatcher.register(Commands.literal("buildmake")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.then(Commands.argument("name", StringArgumentType.word())
						.executes(context -> {
							ServerPlayer player = context.getSource().getPlayer();
							if (player == null) {
								context.getSource().sendFailure(Component.literal("Only players can /buildmake."));
								return 0;
							}
							manager.buildSaved(player, StringArgumentType.getString(context, "name"));
							return 1;
						}))
				.executes(context -> {
					context.getSource().sendFailure(Component.literal(
							"Usage: /buildmake <name> - rebuilds a saved design. See /buildlist")
							.withStyle(ChatFormatting.RED));
					return 0;
				}));

		// /buildlist - list saved builds
		dispatcher.register(Commands.literal("buildlist")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					context.getSource().sendSuccess(
							() -> Component.literal(manager.savedList()).withStyle(ChatFormatting.AQUA), false);
					return 1;
				}));

		// /buildadd <text> - append to a long prompt (chat caps one command at 256 chars)
		dispatcher.register(Commands.literal("buildadd")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.then(Commands.argument("text", StringArgumentType.greedyString())
						.executes(context -> {
							ServerPlayer player = context.getSource().getPlayer();
							if (player == null) {
								context.getSource().sendFailure(Component.literal("Only players can /buildadd."));
								return 0;
							}
							manager.addToPrompt(player, StringArgumentType.getString(context, "text"));
							return 1;
						}))
				.executes(context -> {
					context.getSource().sendFailure(Component.literal(
							"Usage: /buildadd <text> - add a piece of a long description, then /buildgo")
							.withStyle(ChatFormatting.RED));
					return 0;
				}));

		// /buildgo - run the accumulated /buildadd prompt
		dispatcher.register(Commands.literal("buildgo")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					ServerPlayer player = context.getSource().getPlayer();
					if (player == null) {
						context.getSource().sendFailure(Component.literal("Only players can /buildgo."));
						return 0;
					}
					manager.runBufferedBuild(player);
					return 1;
				}));

		// /buildclear - discard the accumulated prompt
		dispatcher.register(Commands.literal("buildclear")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					ServerPlayer player = context.getSource().getPlayer();
					if (player == null) {
						context.getSource().sendFailure(Component.literal("Only players can /buildclear."));
						return 0;
					}
					manager.clearPrompt(player);
					return 1;
				}));

		// /buildideas - suggestions for what to build
		dispatcher.register(Commands.literal("buildideas")
				.requires(PermissionPredicates.require(
						Identifier.fromNamespaceAndPath("aibuilder", "command/build"), PermissionLevel.GAMEMASTERS))
				.executes(context -> {
					for (String line : manager.ideas()) {
						context.getSource().sendSuccess(
								() -> Component.literal(line).withStyle(ChatFormatting.YELLOW), false);
					}
					return 1;
				}));
	}
}
