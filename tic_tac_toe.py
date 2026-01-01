#!/usr/bin/env python3
"""
Tic-Tac-Toe Game
Play against the computer in a classic game of tic-tac-toe!
"""

import random


def print_board(board):
    """Display the game board."""
    print("\n")
    print(f" {board[0]} | {board[1]} | {board[2]} ")
    print("---+---+---")
    print(f" {board[3]} | {board[4]} | {board[5]} ")
    print("---+---+---")
    print(f" {board[6]} | {board[7]} | {board[8]} ")
    print("\n")


def check_winner(board, player):
    """Check if the given player has won."""
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
        [0, 4, 8], [2, 4, 6]              # diagonals
    ]
    return any(all(board[i] == player for i in condition) for condition in win_conditions)


def check_draw(board):
    """Check if the game is a draw."""
    return all(cell in ['X', 'O'] for cell in board)


def get_available_moves(board):
    """Return list of available positions."""
    return [i for i in range(9) if board[i] not in ['X', 'O']]


def minimax(board, depth, is_maximizing, player, opponent):
    """Minimax algorithm for optimal computer moves."""
    if check_winner(board, opponent):
        return -10 + depth
    if check_winner(board, player):
        return 10 - depth
    if check_draw(board):
        return 0

    if is_maximizing:
        max_eval = float('-inf')
        for move in get_available_moves(board):
            board[move] = player
            eval_score = minimax(board, depth + 1, False, player, opponent)
            board[move] = str(move)
            max_eval = max(max_eval, eval_score)
        return max_eval
    else:
        min_eval = float('inf')
        for move in get_available_moves(board):
            board[move] = opponent
            eval_score = minimax(board, depth + 1, True, player, opponent)
            board[move] = str(move)
            min_eval = min(min_eval, eval_score)
        return min_eval


def get_computer_move(board, computer, human):
    """Get the best move for the computer using minimax."""
    available = get_available_moves(board)

    if not available:
        return None

    best_score = float('-inf')
    best_move = available[0]

    for move in available:
        board[move] = computer
        score = minimax(board, 0, False, computer, human)
        board[move] = str(move)

        if score > best_score:
            best_score = score
            best_move = move

    return best_move


def get_human_move(board):
    """Get valid move from human player."""
    available = get_available_moves(board)

    while True:
        try:
            move = input(f"Enter your move (0-8): ").strip()
            move = int(move)

            if move in available:
                return move
            else:
                print("That position is not available. Try again.")
        except (ValueError, KeyboardInterrupt):
            print("\nPlease enter a valid number between 0 and 8.")


def play_game():
    """Main game loop."""
    print("=" * 40)
    print("Welcome to Tic-Tac-Toe!")
    print("=" * 40)
    print("\nBoard positions:")
    print_board([str(i) for i in range(9)])

    # Choose who goes first
    print("Do you want to go first? (y/n): ", end="")
    choice = input().strip().lower()

    if choice == 'y':
        human = 'X'
        computer = 'O'
        current_player = 'human'
    else:
        human = 'O'
        computer = 'X'
        current_player = 'computer'

    board = [str(i) for i in range(9)]

    print(f"\nYou are {human}, Computer is {computer}")
    print("Let's play!\n")

    while True:
        print_board(board)

        if current_player == 'human':
            print("Your turn!")
            move = get_human_move(board)
            board[move] = human

            if check_winner(board, human):
                print_board(board)
                print("🎉 Congratulations! You won! 🎉")
                break

            current_player = 'computer'
        else:
            print("Computer's turn...")
            move = get_computer_move(board, computer, human)
            board[move] = computer
            print(f"Computer chose position {move}")

            if check_winner(board, computer):
                print_board(board)
                print("💻 Computer wins! Better luck next time!")
                break

            current_player = 'human'

        if check_draw(board):
            print_board(board)
            print("🤝 It's a draw!")
            break

    print("\nThanks for playing!")

    # Ask to play again
    print("\nPlay again? (y/n): ", end="")
    if input().strip().lower() == 'y':
        play_game()


if __name__ == "__main__":
    try:
        play_game()
    except KeyboardInterrupt:
        print("\n\nGame interrupted. Thanks for playing!")
