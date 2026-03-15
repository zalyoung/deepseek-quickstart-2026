// snake-game.ts
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridSize = 20;
  private snake: Position[] = [];
  private food: Position = { x: 0, y: 0 };
  private direction: Direction = 'RIGHT';
  private nextDirection: Direction = 'RIGHT';
  private score = 0;
  private highScore = 0;
  private gameState: GameState = 'READY';
  private gameSpeed = 150;
  private gameLoopId?: number;
  private foodTypes = [
    { color: '#FF5252', score: 1 },
    { color: '#FFD740', score: 2 }
  ];
  private currentFoodType = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.init();
  }

  private init() {
    this.loadHighScore();
    this.resetGame();
    this.setupControls();
    this.render();
  }

  private resetGame() {
    this.snake = [
      { x: 5 * this.gridSize, y: 5 * this.gridSize },
      { x: 4 * this.gridSize, y: 5 * this.gridSize },
      { x: 3 * this.gridSize, y: 5 * this.gridSize }
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score = 0;
    this.gameSpeed = 150;
    this.generateFood();
    this.gameState = 'READY';
  }

  private loadHighScore() {
    this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
  }

  private setupControls() {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowUp':
          if (this.direction !== 'DOWN') this.nextDirection = 'UP';
          break;
        case 'ArrowDown':
          if (this.direction !== 'UP') this.nextDirection = 'DOWN';
          break;
        case 'ArrowLeft':
          if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
          break;
        case 'ArrowRight':
          if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
          break;
        case ' ':
          this.togglePause();
          break;
      }
    });
  }

  private togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      cancelAnimationFrame(this.gameLoopId!);
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.gameLoop();
    } else if (this.gameState === 'READY') {
      this.gameState = 'PLAYING';
      this.gameLoop();
    }
  }

  private gameLoop() {
    if (this.gameState !== 'PLAYING') return;

    this.update();
    this.render();

    this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
  }

  private update() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'UP':
        head.y -= this.gridSize;
        break;
      case 'DOWN':
        head.y += this.gridSize;
        break;
      case 'LEFT':
        head.x -= this.gridSize;
        break;
      case 'RIGHT':
        head.x += this.gridSize;
        break;
    }

    // Check collisions
    if (
      head.x < 0 ||
      head.x >= this.canvas.width ||
      head.y < 0 ||
      head.y >= this.canvas.height ||
      this.snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += this.foodTypes[this.currentFoodType].score;
      this.generateFood();
      // Increase speed every 5 points
      if (this.score % 5 === 0 && this.gameSpeed > 50) {
        this.gameSpeed -= 10;
      }
    } else {
      this.snake.pop();
    }
  }

  private generateFood() {
    const availablePositions: Position[] = [];
    for (let x = 0; x < this.canvas.width; x += this.gridSize) {
      for (let y = 0; y < this.canvas.height; y += this.gridSize) {
        if (!this.snake.some(segment => segment.x === x && segment.y === y)) {
          availablePositions.push({ x, y });
        }
      }
    }

    if (availablePositions.length > 0) {
      this.food = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      this.currentFoodType = Math.random() > 0.8 ? 1 : 0; // 20% chance for golden food
    }
  }

  private gameOver() {
    this.gameState = 'GAME_OVER';
    this.saveHighScore();
    cancelAnimationFrame(this.gameLoopId!);
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#2C3E50';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw snake
    this.ctx.fillStyle = '#2ECC71';
    this.snake.forEach(segment => {
      this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);
    });

    // Draw food
    const foodType = this.foodTypes[this.currentFoodType];
    this.ctx.fillStyle = foodType.color;
    this.ctx.fillRect(this.food.x, this.food.y, this.gridSize, this.gridSize);

    // Draw score
    this.ctx.fillStyle = '#ECF0F1';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`High Score: ${this.highScore}`, 10, 50);

    // Draw game state
    if (this.gameState === 'READY') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    } else if (this.gameState === 'PAUSED') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';
    } else if (this.gameState === 'GAME_OVER') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#E74C3C';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
      this.ctx.fillText('Press SPACE to Restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
      this.ctx.textAlign = 'left';
    }
  }

  public start() {
    this.togglePause();
  }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new SnakeGame('gameCanvas');
  game.start();
});