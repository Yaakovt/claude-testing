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
							"Tell me what to build, e.g. /build a cozy medieval house with a redstone piston door")
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
							"Usage: /buildset <model|timeout|speed> <value>  e.g. /buildset model sonnet")
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
	}
}
