// scripts/mastermod/utils/logger.js

export class Logger {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      bright: '\x1b[1m'
    };
  }

  info(message) {
    console.log(`${this.colors.blue}ℹ️  ${message}${this.colors.reset}`);
  }

  success(message) {
    console.log(`${this.colors.green}✅ ${message}${this.colors.reset}`);
  }

  warn(message) {
    console.log(`${this.colors.yellow}⚠️  ${message}${this.colors.reset}`);
  }

  error(message) {
    console.log(`${this.colors.red}❌ ${message}${this.colors.reset}`);
  }

  debug(message) {
    console.log(`${this.colors.cyan}🔍 ${message}${this.colors.reset}`);
  }

  critical(message) {
    console.log(`${this.colors.red}${this.colors.bright}🚨 CRÍTICO: ${message}${this.colors.reset}`);
  }

  separator() {
    console.log(`${this.colors.cyan}${'='.repeat(50)}${this.colors.reset}`);
  }

  section(title) {
    console.log(`\n${this.colors.magenta}${this.colors.bright}📋 ${title}${this.colors.reset}`);
    console.log(`${this.colors.magenta}${'─'.repeat(title.length + 4)}${this.colors.reset}`);
  }
}