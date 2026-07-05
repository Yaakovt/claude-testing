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
	}
}
